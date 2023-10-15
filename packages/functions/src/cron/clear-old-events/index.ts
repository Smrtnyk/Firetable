import { deleteDocument } from "../../delete-document/index.js";
import { db } from "../../init.js";
import * as functions from "firebase-functions";
import { firestore } from "firebase-admin";
import { Collection } from "../../../types/types.js";

const { logger } = functions;
const DELETION_AGE_YEARS = 1; // Number of years after which events are considered old

/**
 * Clears events that are a year old from the Firestore collection.
 */
export async function clearOldEvents(): Promise<void> {
    try {
        const oldEvents = await getOldEvents();

        // If no old events are found, log the outcome and exit.
        if (oldEvents.empty) {
            logger.info("No old events found to be cleared.");
            return;
        }

        // Delete all old events concurrently using the deleteDocument function.
        const deletePromises = oldEvents.docs.map(eventDoc =>
            deleteDocument({
                col: Collection.EVENTS,
                id: eventDoc.id
            }).catch(error => {
                // Individual error handling for each document delete operation
                logger.error(`Error deleting event with ID ${eventDoc.id}:`, error);
            })
        );

        await Promise.all(deletePromises);
        logger.info(`${oldEvents.size} old events have been cleared.`);

    } catch (error) {
        logger.error("Error occurred while clearing old events:", error);
        // Re-throwing the error if you want the error to propagate to the caller.
        // Alternatively, you can decide on another approach, like sending an alert or a notification.
        throw new Error("Failed to clear old events. Check logs for details.");
    }
}

/**
 * Fetches events from the Firestore collection that are older than a year.
 */
function getOldEvents(): Promise<firestore.QuerySnapshot<firestore.DocumentData>> {
    const date = new Date();
    date.setFullYear(date.getFullYear() - DELETION_AGE_YEARS);
    return db.collection(Collection.EVENTS)
        .where("date", "<=", date.getTime())
        .get()
        .catch(error => {
            logger.error("Error fetching old events:", error);
            throw new Error("Failed to fetch old events from Firestore.");
        });
}
