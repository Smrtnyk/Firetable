import type { CallableRequest } from "firebase-functions/https";
import type { GuestDoc } from "@shared-types";
import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { HttpsError } from "firebase-functions/v2/https";

export interface UpdateGuestInfo {
    updatedData: Pick<
        GuestDoc,
        "contact" | "hashedContact" | "lastModified" | "maskedContact" | "name" | "tags"
    >;
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

        const dataToUpdate: UpdateGuestInfo["updatedData"] = {
            lastModified: Date.now(),
            contact: updatedData.contact,
            hashedContact: updatedData.hashedContact,
            maskedContact: updatedData.maskedContact,
            name: updatedData.name,
        };
        if (updatedData.tags) {
            dataToUpdate.tags = updatedData.tags;
        }

        await oldDocRef.update(dataToUpdate);

        return { success: true };
    } catch (error: any) {
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "An error occurred while updating guest data.", error);
    }
}
