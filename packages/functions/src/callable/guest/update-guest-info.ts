import type { CallableRequest } from "firebase-functions/https";
import type { GuestDoc } from "../../../types/types.js";
import { db } from "../../init.js";
import { HttpsError } from "firebase-functions/v2/https";

interface UpdateGuestInfo {
    updatedData: Pick<GuestDoc, "contact" | "name">;
    guestId: string;
    organisationId: string;
}

export async function updateGuestDataFn(
    req: CallableRequest<UpdateGuestInfo>,
): Promise<{ success: boolean }> {
    const { updatedData, guestId, organisationId } = req.data;

    const oldDocRef = db.doc(`organisations/${organisationId}/guests/${guestId}`);

    if (guestId === updatedData.contact) {
        try {
            await oldDocRef.update({
                name: updatedData.name,
            });
            return { success: true };
        } catch (error: any) {
            // Check if the error is due to the document not existing
            if (error.code === "not-found" || error.message.includes("No document to update")) {
                throw new HttpsError("not-found", "Guest does not exist.");
            }
            // Re-throw other errors
            throw error;
        }
    }
    // Contact has changed
    const newDocRef = db.doc(`organisations/${organisationId}/guests/${updatedData.contact}`);

    // Check if new document already exists
    const newDocSnapshot = await newDocRef.get();
    if (newDocSnapshot.exists) {
        throw new HttpsError("already-exists", "A guest with the updated contact already exists.");
    }

    await db.runTransaction(async (transaction) => {
        const oldDocSnapshot = await transaction.get(oldDocRef);
        if (!oldDocSnapshot.exists) {
            throw new HttpsError("not-found", "Guest does not exist.");
        }
        const oldData = oldDocSnapshot.data();

        const newData = {
            ...oldData,
            name: updatedData.name,
            contact: updatedData.contact,
        };

        transaction.set(newDocRef, newData);
        transaction.delete(oldDocRef);
    });
    return { success: true };
}
