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
        // Step 1: Retrieve all organizations
        const orgsSnapshot = await db.collection(Collection.ORGANISATIONS).get();

        const allDeletePromises = [];

        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;

            // Step 2: For each organization, retrieve all properties.
            const propertiesSnapshot = await db.collection(`${Collection.ORGANISATIONS}/${orgId}/${Collection.PROPERTIES}`).get();

            for (const propertyDoc of propertiesSnapshot.docs) {
                const propertyId = propertyDoc.id;

                // Step 3: For each property under an organization, retrieve and delete the old events.
                const oldEvents = await getOldEvents(orgId, propertyId);

                if (!oldEvents.empty) {
                    const deletePromises = oldEvents.docs.map(eventDoc =>
                        deleteDocument({
                            col: `${Collection.ORGANISATIONS}/${orgId}/${Collection.PROPERTIES}/${propertyId}/${Collection.EVENTS}`,
                            id: eventDoc.id
                        }).catch(error => {
                            // Individual error handling for each document delete operation
                            logger.error(`Error deleting event with ID ${eventDoc.id}:`, error);
                        })
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
async function getOldEvents(organisationId: string, propertyId: string): Promise<firestore.QuerySnapshot<firestore.DocumentData>> {
    const date = new Date();
    date.setFullYear(date.getFullYear() - DELETION_AGE_YEARS);

    try {
        return await db.collection(`${Collection.ORGANISATIONS}/${organisationId}/${Collection.PROPERTIES}/${propertyId}/${Collection.EVENTS}`)
            .where("date", "<=", date.getTime())
            .get();
    } catch (error) {
        logger.error("Error fetching old events:", error);
        throw new Error("Failed to fetch old events from Firestore.");
    }
}
