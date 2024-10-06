import type { EventOwner } from "../db.js";
import type { AdminUser, EventLog, User } from "@firetable/types";
import { eventLogsDoc } from "../db.js";
import { arrayUnion, setDoc, Timestamp } from "firebase/firestore";

/**
 * It can throw so should be called inside a try-catch block
 * @param eventOwner The owner of the event
 * @param logMessage The message to be logged
 * @param user The user who created the log
 */
export async function addLogToEvent(
    eventOwner: EventOwner,
    logMessage: string,
    user: AdminUser | User,
): Promise<void> {
    const eventLogsRef = eventLogsDoc(eventOwner);

    const logEntry: EventLog = {
        message: logMessage,
        timestamp: Timestamp.now(),
        creator: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };

    await setDoc(
        eventLogsRef,
        {
            logs: arrayUnion(logEntry),
        },
        { merge: true },
    );
}
