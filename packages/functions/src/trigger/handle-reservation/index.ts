import webpush from "web-push";
import * as functions from "firebase-functions";
import diff from "diff-arrays-of-objects";
import { db } from "../../init.js";
import { ChangeType, PushSubscriptionDoc, Collection, BaseTable } from "../../../types/types.js";
import { firestore } from "firebase-admin";
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;

const { logger } = functions;

/**
 * Adds reservation-related events to the feed collection.
 *
 * @param change - Type of the change (e.g., ADD or DELETE).
 * @param table - Table data where the reservation is made.
 * @param type - Type of the event (generally "Reservation").
 * @param feedCollection - Firestore reference to the event feed collection.
 * @throws Will throw an error if the reservation is not provided on the table or for unsupported change types.
 */
async function addToEventFeed(
    change: ChangeType,
    table: BaseTable,
    type: string,
    feedCollection: FirebaseFirestore.CollectionReference
): Promise<void> {
    if (!table?.reservation) {
        logger.error("Reservation not provided on the table!");
        throw new Error("Reservation not provided on the table!");
    }

    let body;
    const { reservation, label } = table;
    const reservedBy = reservation.reservedBy;

    switch (change) {
        case ChangeType.ADD:
            body = `${reservedBy.email} made new reservation on table ${label}`;
            break;
        case ChangeType.DELETE:
            body = `${reservedBy.email} deleted a reservation on table ${label}`;
            break;
        default:
            logger.error("Unsupported change type.");
            throw new Error("Unsupported change type.");
    }

    await feedCollection.add({
        body,
        timestamp: Date.now(),
        type,
    });
}

/**
 * Retrieves all registered push notification tokens from Firestore.
 *
 * @returns A promise that resolves with an array of push subscription documents.
 */
async function getMessagingTokensFromFirestore(): Promise<PushSubscriptionDoc[]> {
    const tokensColl = await db.collection(Collection.FCM).get();
    return tokensColl.docs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }) as PushSubscriptionDoc);
}

/**
 * Sends push notifications to the provided list of tokens.
 *
 * @param tokens - Array of push subscription tokens.
 * @param title - Title of the push notification.
 * @param body - Body of the push notification.
 * @throws Will throw an error if there's an issue sending the push notification.
 */
async function sendPushMessageToSubscriptions(
    tokens: PushSubscriptionDoc[],
    title: string,
    body: string
): Promise<void> {
    const promises = tokens.map(async token => {
        const { endpoint, keys, id: docID } = token;

        if (!endpoint.startsWith("https://fcm.googleapis")) {
            return;
        }

        try {
            await webpush.sendNotification({ endpoint, keys }, `${title}|${body}`);
        } catch (error: any) {
            if (error.body?.includes("push subscription has unsubscribed or expired")) {
                await db.collection(Collection.FCM).doc(docID).delete();
            } else {
                logger.error("Error sending push notification:", error);
            }
        }
    });

    await Promise.all(promises);
}

/**
 * Sends push notifications for new table reservations.
 *
 * @param table - Table data where the reservation is made.
 * @throws Will throw an error if reservation details are incomplete.
 */
async function handlePushMessagesOnNewReservation(
    table: BaseTable
): Promise<void> {
    if (!table?.reservation) {
        logger.error("No reservation found!");
        return;
    }

    const { label, reservation } = table;
    const { reservedBy, guestName, numberOfGuests } = reservation;

    if (!reservedBy || !guestName || !numberOfGuests) {
        logger.error("Reservation details are incomplete!");
        return;
    }

    await sendPushMessageToSubscriptions(
        await getMessagingTokensFromFirestore(),
        `New reservation on table ${label}`,
        `${reservedBy.email} made a reservation for ${guestName}, ${numberOfGuests} pax.`
    );
}

/**
 * Extracts tables with reservations from provided serialized data.
 *
 * @param json - Serialized representation of the floor layout.
 * @returns Array of tables that have reservations.
 */
function extractReservedTablesFrom(json: Record<PropertyKey, any>): BaseTable[] {
    return json.objects
        .map(({ objects }: any) => objects[0])
        .filter(({ reservation }: BaseTable) => !!reservation);
}

/**
 * Processes and handles the addition of new reservations.
 *
 * @param context - Context of the event that triggered the function.
 * @param added - Array of newly added reservations.
 */
async function handleNewReservation(context: functions.EventContext, added: BaseTable[]): Promise<void> {
    if (!added?.length) {
        return;
    }

    const promises = added.map(async table => {
        await handlePushMessagesOnNewReservation(table);
        await addToEventFeed(
            ChangeType.ADD,
            table,
            "Reservation",
            db.collection(`${Collection.EVENTS}/${context.params.eventId}/eventFeed`)
        );
    });

    await Promise.all(promises);
}

/**
 * Updates the reservation count for an event to reflect the percentage of tables reserved.
 *
 * @param context - Context of the event that triggered the function.
 */
async function updateEventReservationCount(
    context: functions.EventContext
): Promise<void> {
    const PERCENTILE_BASE = 100;
    const eventRef = db.collection(Collection.EVENTS).doc(context.params.eventId);
    const allEventFloors = await eventRef.collection(Collection.FLOORS).get();

    if (allEventFloors.empty) {
        return;
    }

    let overallTables = 0;
    let overallReserved = 0;

    allEventFloors.docs.forEach(doc => {
        const floor = doc.data();
        const tables = floor.json.objects.map(({ objects }: any) => objects[0]);
        overallTables += tables.length;
        overallReserved += tables.filter((table: BaseTable) => !!table.reservation).length;
    });

    const percentage = (overallReserved / overallTables) * PERCENTILE_BASE;
    await eventRef.update({ reservedPercentage: percentage });
}

/**
 * Main cloud function to handle changes in table reservations.
 * Detects differences between old and new reservation data and updates the event feed and reservation count accordingly.
 *
 * @param change - Before and after snapshots of the changed document.
 * @param context - Context of the event that triggered the function.
 * @throws Will throw an error if there's an issue handling the reservation or if there's unexpected data loss.
 */
export async function handleReservation(
    { before, after }: functions.Change<QueryDocumentSnapshot>,
    context: functions.EventContext
): Promise<void> {
    try {
        const prevData = before.data();
        const newData = after.data();

        if (!prevData || !newData) {
            logger.error("No data in either the before or after snapshot.");
            throw new functions.https.HttpsError("data-loss", "Unexpected data loss.");
        }

        const prevTablesReservations = extractReservedTablesFrom(prevData.json);
        const newTablesReservations = extractReservedTablesFrom(newData.json);
        const differences = diff(prevTablesReservations, newTablesReservations, "label");

        await handleNewReservation(context, differences.added);
        await updateEventReservationCount(context);

    } catch (error: any) {
        logger.error("Error handling reservation:", error);
        throw new functions.https.HttpsError("internal", `Error handling reservation: ${error.message}`, error);
    }
}
