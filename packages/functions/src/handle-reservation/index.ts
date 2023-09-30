import webpush from "web-push";
import * as functions from "firebase-functions";
import diff from "diff-arrays-of-objects";
import { db } from "../init.js";
import { ChangeType, PushSubscriptionDoc, UpdatedTablesDifference, Collection, BaseTable } from "../../types/types.js";
import { firestore } from "firebase-admin";
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;

const { logger } = functions;

/**
 * Add reservation changes to the event feed.
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
 * Retrieve all push notification tokens from Firestore.
 */
async function getMessagingTokensFromFirestore(): Promise<PushSubscriptionDoc[]> {
    const tokensColl = await db.collection(Collection.FCM).get();
    return tokensColl.docs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }) as PushSubscriptionDoc);
}

/**
 * Send push notifications to the provided list of tokens.
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
 * Handle sending push notifications for new reservations.
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
 * Determine differences between the table reservations before and after changes.
 */
function getDifferenceBetweenTables(
    prevData: FirebaseFirestore.DocumentData,
    newData: FirebaseFirestore.DocumentData
): UpdatedTablesDifference {
    const prevTablesReservations = extractReservedTablesFrom(prevData.json);
    const newTablesReservations = extractReservedTablesFrom(newData.json);
    const { added, removed } = diff(prevTablesReservations, newTablesReservations, "label");
    const { updated } = diff(prevTablesReservations, newTablesReservations, "reservation");

    return {
        added,
        removed,
        updated,
    };
}

/**
 * Extract tables from provided data that have reservations.
 */
function extractReservedTablesFrom(json: any): BaseTable[] {
    return json.objects
        .map(({ objects }: any) => objects[0])
        .filter(({ reservation }: BaseTable) => !!reservation);
}

/**
 * Handle reservations that have been added.
 */
async function handleAddedReservation(
    context: functions.EventContext,
    added: BaseTable[]
): Promise<void> {
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
 * Update the percentage of reserved tables for an event.
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
 * Main cloud function to handle reservation changes.
 */
export async function handleReservation(
    { before, after }: functions.Change<QueryDocumentSnapshot>,
    context: functions.EventContext
): Promise<void> {
    try {
        const { added } = getDifferenceBetweenTables(before.data(), after.data());
        await handleAddedReservation(context, added);
        await updateEventReservationCount(context);
    } catch (error) {
        logger.error("Error handling reservation:", error);
        throw new functions.https.HttpsError("internal", "Error handling reservation.", error);
    }
}
