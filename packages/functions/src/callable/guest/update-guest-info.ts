import type { CallableRequest } from "firebase-functions/https";
import type { GuestDoc } from "../../../types/types.js";
import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";

export interface UpdateGuestInfo {
    updatedData: Pick<GuestDoc, "contact" | "name">;
    guestId: string;
    organisationId: string;
}

export async function updateGuestDataFn(
    req: CallableRequest<UpdateGuestInfo>,
): Promise<{ success: boolean }> {
    const { updatedData, guestId, organisationId } = req.data;

    const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
    const oldDocRef = guestsCollectionRef.doc(guestId);

    try {
        const oldDocSnapshot = await oldDocRef.get();
        if (!oldDocSnapshot.exists) {
            throw new HttpsError("not-found", "Guest does not exist.");
        }

        // Check if the contact has changed
        const oldData = oldDocSnapshot.data() as GuestDoc;
        const contactChanged = oldData.contact !== updatedData.contact;

        if (contactChanged) {
            // Check if another guest document already has the updated contact
            const querySnapshot = await guestsCollectionRef
                .where("contact", "==", updatedData.contact)
                .get();

            if (!querySnapshot.empty) {
                throw new HttpsError(
                    "already-exists",
                    "A guest with the updated contact already exists.",
                );
            }
        }

        await oldDocRef.update({
            contact: updatedData.contact,
            name: updatedData.name,
        });

        return { success: true };
    } catch (error: any) {
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An error occurred while updating guest data.", error);
    }
}
