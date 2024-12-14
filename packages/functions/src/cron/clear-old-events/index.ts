import type { QuerySnapshot } from "firebase-admin/firestore";
import { deleteDocument } from "../../delete-document/index.js";
import { db } from "../../init.js";
import { getEventsPath } from "../../paths.js";
import { Collection } from "@shared-types";
import { logger } from "firebase-functions/v2";

// Number of years after which events are considered old
const DELETION_AGE_YEARS = 1;

/**
 * Clears events that are a year old from the Firestore collection.
 */
export async function clearOldEvents(): Promise<void> {
    try {
        // Step 1: Retrieve all organisations
        const orgsSnapshot = await db.collection(Collection.ORGANISATIONS).get();

        const allDeletePromises = [];

        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;

            // Step 2: For each organisation, retrieve all properties.
            const propertiesSnapshot = await db
                .collection(`${Collection.ORGANISATIONS}/${orgId}/${Collection.PROPERTIES}`)
                .get();

            for (const propertyDoc of propertiesSnapshot.docs) {
                const propertyId = propertyDoc.id;

                // Step 3: For each property under an organisation, retrieve and delete the old events.
                const oldEvents = await getOldEvents(orgId, propertyId);

                if (oldEvents && !oldEvents.empty) {
                    const deletePromises = oldEvents.docs.map((eventDoc) =>
                        deleteDocument({
                            col: `${Collection.ORGANISATIONS}/${orgId}/${Collection.PROPERTIES}/${propertyId}/${Collection.EVENTS}`,
                            id: eventDoc.id,
                        }).catch((error) => {
                            // Individual error handling for each document delete operation
                            logger.error(`Error deleting event with ID ${eventDoc.id}:`, error);
                        }),
                    );

                    allDeletePromises.push(...deletePromises);
                }
            }
        }

        await Promise.all(allDeletePromises);
        logger.info(`Old events have been cleared.`);
    } catch (error) {
        logger.error("Error occurred while clearing old events:", error);
        throw new Error("Failed to clear old events. Check logs for details.");
    }
}

/**
 * Fetches events from the Firestore collection that are older than a year.
 */
async function getOldEvents(
    organisationId: string,
    propertyId: string,
): Promise<QuerySnapshot | undefined> {
    const date = new Date();
    date.setFullYear(date.getFullYear() - DELETION_AGE_YEARS);

    try {
        return await db
            .collection(getEventsPath(organisationId, propertyId))
            .where("date", "<=", date.getTime())
            .get();
    } catch (error) {
        logger.error("Error fetching old events:", error);
    }
    return undefined;
}
