import webpush from "web-push";
import * as functions from "firebase-functions";
import diff from "diff-arrays-of-objects";
import { db } from "../init.js";
import { ChangeType, UpdatedTablesDifference } from "../../types/types.js";
import { BaseTable } from "@firetable/floor-creator";
import { Collection, isSome, PushSubscriptionDoc } from "@firetable/types";
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
    if (!isSome(reservation)) {
        throw new Error("Reservation not provided on the table!");
    }
    switch (change) {
        case ChangeType.ADD:
            body = `${
                reservation.value.reservedBy.email
            } made new reservation on table ${label}`; // NOSONAR
            break;
        case ChangeType.DELETE:
            body = `${
                reservation.value.reservedBy.email
            } deleted a reservation on table ${label}`; // NOSONAR
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
    const tokens: PushSubscriptionDoc[] = [];
    tokensColl.docs.forEach((doc) => {
        if (doc.exists) {
            tokens.push({ id: doc.id, ...doc.data() } as PushSubscriptionDoc);
        }
    });

    logger.log("[INFO] Found tokens in db " + tokens);
    return tokens;
}

async function sendPushMessageToSubscriptions(
    tokens: PushSubscriptionDoc[],
    title: string,
    body: string
): Promise<void> {
    for (const token of tokens) {
        const { endpoint, keys, id: docID } = token;
        logger.log("Processing token: ", { endpoint, keys });
        if (!endpoint.startsWith("https://fcm.googleapis")) {
            logger.log(
                "Subscription endpoint does not belong to google cloud!"
            );
            continue;
        }
        logger.log("[INFO] Sending push to devices!");
        try {
            await webpush.sendNotification({ endpoint, keys }, `${title}|${body}`);
        } catch (error: any) {
            if (
                error.body.includes(
                    "push subscription has unsubscribed or expired"
                )
            ) {
                await db.collection(Collection.FCM).doc(docID).delete();
            }
            logger.error("Error occurred while sending subscription", error);
        }
    }
}

async function handlePushMessagesOnNewReservation(
    table: BaseTable
): Promise<void> {
    logger.log("Reservation is added!", table);

    const { label, reservation } = table;

    if (!isSome(reservation)) {
        logger.error("No reservation found!");
        return;
    }

    const { reservedBy, guestName, numberOfGuests } = reservation.value;

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
    if (!newData || !prevData) {
        logger.error("Invalid data!");
    }
    const prevTablesReservations: BaseTable[] = prevData.json.objects.map((obj: any) => {
        return obj.objects[0];
    }).filter(
        ({ reservation }: BaseTable) => !!reservation
    );

    const newTablesReservations: BaseTable[] = newData.json.objects.map((obj: any) => {
        return obj.objects[0];
    }).filter(
        ({ reservation }: BaseTable) => !!reservation
    );

    logger.log("Init on new reservation!");
    const { added, removed } = diff(
        prevTablesReservations,
        newTablesReservations,
        "id"
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
        const tables = floor.json.objects.map((obj: any) => {
            return obj.objects[0];
        });
        logger.log(tables);
        overallTables += tables.length;
        overallReserved += tables.filter(
            (table: BaseTable) => !!table.reservation
        ).length;
    }

    const percentage = (overallReserved / overallTables) * PERCENTILE_BASE;
    logger.log(percentage);
    await eventRef.update({
        reservedPercentage: percentage,
    });
}

export async function handleReservation(
    { before, after }: functions.Change<QueryDocumentSnapshot>,
    context: functions.EventContext
): Promise<void> {
    const { added } = getDifferenceBetweenTables(before.data(), after.data());

    await handleAddedReservation(context, added);
    await updateEventReservationCount(context);
}
