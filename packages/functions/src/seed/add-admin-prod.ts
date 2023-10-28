import { ADMIN, Collection } from "../../types/types.js";
import { default as admin } from "firebase-admin";
import serviceAccount from "./service-account.json" assert { type: "json" };

const app = admin.initializeApp({
    // @ts-ignore
    credential: admin.credential.cert(serviceAccount)
});

export const db = app.firestore();
export const auth = admin.auth();

const ADMIN_MAIL = "admin@firetable.at";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

(async function addAdmin() {
    try {
        const user = await auth.createUser({
            email: ADMIN_MAIL,
            password: ADMIN_PASSWORD,
        });

        await auth.setCustomUserClaims(user.uid, { role: ADMIN });
        await admin.auth().getUser(user.uid);

        await db.collection(Collection.USERS).doc(user.uid).set({
            email: ADMIN_MAIL,
            name: ADMIN_NAME,
            role: ADMIN,
        });

        process.exit();
    } catch (err: any) {
        console.log(err.message ?? err);
        process.exit(1);
    }
})();
