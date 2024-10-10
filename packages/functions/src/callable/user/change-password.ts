import type { CallableRequest } from "firebase-functions/v2/https";
import { auth } from "../../init.js";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

const MIN_PASSWORD_LENGTH = 6;

export async function changePasswordFn(
    req: CallableRequest<{ newPassword: string }>,
): Promise<{ success: boolean }> {
    if (!req.auth) {
        logger.error("Unauthenticated user tried to change password.");
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const uid: string = req.auth.uid;
    const newPassword: string = req.data.newPassword;

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
        logger.error("Invalid password provided by user:", uid);
        throw new HttpsError("invalid-argument", "Password must be at least 6 characters long!");
    }

    try {
        await auth.updateUser(uid, { password: newPassword });
        logger.log("Password changed successfully for user:", uid);
        return { success: true };
    } catch (error) {
        logger.error("Failed to update the password for user:", uid, error);
        throw new HttpsError("internal", "Failed to update the user password.");
    }
}
