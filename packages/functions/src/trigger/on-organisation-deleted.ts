import { Collection } from "@shared-types";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";

import { deleteDocument } from "../delete-document/index.js";
import { auth, db } from "../init.js";

/**
 * Function to handle the deletion of an organisation and its subcollections.
 *
 * @param params - Parameters containing the organisationId to be deleted.
 * @throws HttpsError - Throws an error with a specific code if the deletion process fails.
 */
export async function onOrganisationDeletedFn(params: { organisationId: string }): Promise<void> {
    const { organisationId } = params;

    try {
        logger.info(`Starting process for organisation with ID: ${organisationId}`);

        // First, delete associated Auth users
        await deleteAuthUsersOfOrganisation(organisationId);

        // Then, delete the organisation document and its subcollections
        await deleteDocument({ col: Collection.ORGANISATIONS, id: organisationId });

        logger.info(
            `Successfully completed deletion process for organisation with ID: ${organisationId}`,
        );
    } catch (error: any) {
        logger.error(`Error in deletion process for organisation ID ${organisationId}:`, error);
        throw new HttpsError(
            "internal",
            `Failed to complete deletion process for organisation with ID ${organisationId}. Error: ${error.message}`,
        );
    }
}

/**
 * Deletes Firebase Authentication users associated with an organisation.
 *
 * @param organisationId - The ID of the organisation.
 */
async function deleteAuthUsersOfOrganisation(organisationId: string): Promise<void> {
    const usersRef = db.collection(
        `${Collection.ORGANISATIONS}/${organisationId}/${Collection.USERS}`,
    );
    const snapshot = await usersRef.get();

    const deletePromises: Promise<void>[] = [];
    snapshot.forEach(function (doc) {
        // Document ID is the user's UID
        const userId = doc.id;
        deletePromises.push(auth.deleteUser(userId));
    });

    await Promise.all(deletePromises);
    logger.info(`Deleted all Auth users associated with organisation ID: ${organisationId}`);
}
