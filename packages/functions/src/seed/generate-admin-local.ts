import * as admin from "firebase-admin";
import { ACTIVITY_STATUS, Collection, Role } from "@firetable/types";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:4000";

admin.initializeApp({ projectId: "firetable-eu" });

const auth = admin.auth();
const db = admin.firestore();

const ADMIN_MAIL = "admin@firetable.at";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

(async function generateAdmin() {
    try {
        const user = await auth.createUser({
            email: ADMIN_MAIL,
            password: ADMIN_PASSWORD,
        });

        await auth.setCustomUserClaims(user.uid, { role: Role.ADMIN });
        await admin.auth().getUser(user.uid);

        await db.collection(Collection.USERS).doc(user.uid).set({
            email: ADMIN_MAIL,
            name: ADMIN_NAME,
            role: Role.ADMIN,
            floors: [],
            status: ACTIVITY_STATUS.OFFLINE,
        });

        process.exit();
    } catch (err: any) {
        console.log(err.message ?? err);
        process.exit(1);
    }
})();
