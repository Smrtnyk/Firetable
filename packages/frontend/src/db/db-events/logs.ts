import type { AppUser, EventLog } from "@firetable/types";

import { arrayUnion, setDoc, Timestamp } from "firebase/firestore";

import type { EventOwner } from "../db.js";

import { eventLogsDoc } from "../db.js";

/**
 * It can throw so should be called inside a try-catch block
 * @param eventOwner The owner of the event
 * @param logMessage The message to be logged
 * @param user The user who created the log
 */
export async function addLogToEvent(
    eventOwner: EventOwner,
    logMessage: string,
    user: AppUser,
): Promise<void> {
    const eventLogsRef = eventLogsDoc(eventOwner);

    const logEntry: EventLog = {
        creator: {
            email: user.email,
            id: user.id,
            name: user.name,
            role: user.role,
        },
        message: logMessage,
        timestamp: Timestamp.now(),
    };

    await setDoc(
        eventLogsRef,
        {
            logs: arrayUnion(logEntry),
        },
        { merge: true },
    );
}
