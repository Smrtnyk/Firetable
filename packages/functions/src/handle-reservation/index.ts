import webpush from "web-push";
import * as functions from "firebase-functions";
import diff from "diff-arrays-of-objects";
import { db } from "../init.js";
import { ChangeType, UpdatedTablesDifference } from "../../types/types.js";
import { BaseTable } from "@firetable/floor-creator";
import { Collection, PushSubscriptionDoc } from "@firetable/types";
import { firestore } from "firebase-admin";
import QueryDocumentSnapshot = firestore.QueryDocumentSnapshot;

const { logger } = functions;

async function addToEventFeed(
    change: ChangeType,
    table: BaseTable,
    type: string,
    feedCollection: FirebaseFirestore.CollectionReference
): Promise<void> {
    let body: string;
    const { reservation, label } = table;
    if (!reservation) {
        throw new Error("Reservation not provided on the table!");
    }
    switch (change) {
        case ChangeType.ADD:
            body = `${reservation.reservedBy.email} made new reservation on table ${label}`;
            break;
        case ChangeType.DELETE:
            body = `${reservation.reservedBy.email} deleted a reservation on table ${label}`;
            break;
        default:
            body = "";
    }
    await feedCollection.add({
        body,
        timestamp: Date.now(),
        type,
    });
}

async function getMessagingTokensFromFirestore(): Promise<PushSubscriptionDoc[]> {
    const tokensColl = await db.collection(Collection.FCM).get();
    return tokensColl
        .docs
        .filter(doc => doc.exists)
        .map(doc => ({ id: doc.id, ...doc.data() }) as PushSubscriptionDoc);
}

async function sendPushMessageToSubscriptions(
    tokens: PushSubscriptionDoc[],
    title: string,
    body: string
): Promise<void> {
    for (const token of tokens) {
        const { endpoint, keys, id: docID } = token;
        if (!endpoint.startsWith("https://fcm.googleapis")) {
            continue;
        }
        try {
            await webpush.sendNotification({ endpoint, keys }, `${title}|${body}`);
        } catch (error: any) {
            if (error.body.includes("push subscription has unsubscribed or expired")) {
                await db.collection(Collection.FCM).doc(docID).delete();
            }
        }
    }
}

async function handlePushMessagesOnNewReservation(
    table: BaseTable
): Promise<void> {
    const { label, reservation } = table;

    if (!reservation) {
        logger.error("No reservation found!");
        return;
    }

    const { reservedBy, guestName, numberOfGuests } = reservation;

    if (!reservedBy || !guestName || !numberOfGuests) {
        logger.error("Reservation is invalid!");
        return;
    }

    await sendPushMessageToSubscriptions(
        await getMessagingTokensFromFirestore(),
        `New reservation on table ${label}`,
        `${reservedBy.email} made a reservation for ${guestName}, ${numberOfGuests} pax.`
    );
}

function getDifferenceBetweenTables(
    prevData: FirebaseFirestore.DocumentData,
    newData: FirebaseFirestore.DocumentData
): UpdatedTablesDifference {
    const prevTablesReservations: BaseTable[] = extractReservedTablesFrom(prevData.json);
    const newTablesReservations: BaseTable[] = extractReservedTablesFrom(newData.json);
    const { added, removed } = diff(
        prevTablesReservations,
        newTablesReservations,
        "label"
    );
    const { updated } = diff(
        prevTablesReservations,
        newTablesReservations,
        "reservation"
    );

    return {
        added,
        removed,
        updated,
    };
}

function extractReservedTablesFrom(json: any): BaseTable[] {
    return json
        .objects
        .map(({ objects }: any) => objects[0])
        .filter(({ reservation }: BaseTable) => !!reservation);
}

async function handleAddedReservation(
    context: functions.EventContext,
    added: BaseTable[]
): Promise<void> {
    if (!added || !added.length) {
        return;
    }
    for (const table of added) {
        await handlePushMessagesOnNewReservation(table);
        await addToEventFeed(
            ChangeType.ADD,
            table,
            "Reservation",
            db.collection(
                `${Collection.EVENTS}/${context.params.eventId}/eventFeed`
            )
        );
    }
}

async function updateEventReservationCount(
    context: functions.EventContext
): Promise<void> {
    const PERCENTILE_BASE = 100;
    const eventRef = db
        .collection(Collection.EVENTS)
        .doc(context.params.eventId);
    const allEventFloors = await eventRef.collection(Collection.FLOORS).get();

    if (allEventFloors.empty) {
        return;
    }

    let overallTables = 0;
    let overallReserved = 0;
    for (const doc of allEventFloors.docs) {
        const floor = doc.data();
        const tables = floor.json.objects.map(({ objects }: any) => objects[0]);
        overallTables += tables.length;
        overallReserved += tables.filter((table: BaseTable) => !!table.reservation).length;
    }

    const percentage = (overallReserved / overallTables) * PERCENTILE_BASE;
    await eventRef.update({ reservedPercentage: percentage });
}

export async function handleReservation(
    { before, after }: functions.Change<QueryDocumentSnapshot>,
    context: functions.EventContext
): Promise<void> {
    const { added } = getDifferenceBetweenTables(before.data(), after.data());
    logger.info(added);
    await handleAddedReservation(context, added);
    await updateEventReservationCount(context);
}
