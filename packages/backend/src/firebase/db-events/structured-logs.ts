import type { EventOwner } from "../db.js";
import type { NewLogEntry, ReservationLogEntry } from "@firetable/types";
import { eventLogsDoc } from "../db.js";
import { arrayUnion, setDoc } from "firebase/firestore";

export async function addStructuredLogToEvent(
    eventOwner: EventOwner,
    logEntry: NewLogEntry,
): Promise<void> {
    const eventLogsRef = eventLogsDoc(eventOwner);

    const fullLogEntry: ReservationLogEntry = {
        ...logEntry,
        timestamp: Date.now(),
    };

    await setDoc(
        eventLogsRef,
        {
            structuredLogs: arrayUnion(fullLogEntry),
        },
        { merge: true },
    );
}
