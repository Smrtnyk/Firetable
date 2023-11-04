import { ADMIN } from "../../types/types.js";
import { default as admin } from "firebase-admin";
import serviceAccount from "./service-account.json" assert { type: "json" };

const app = admin.initializeApp({
    // @ts-expect-error -- it has enough fields
    credential: admin.credential.cert(serviceAccount),
});

export const db = app.firestore();
export const auth = admin.auth();

const ADMIN_MAIL = "admin@firetable.at";
const ADMIN_PASSWORD = "admin123";

(async function addAdmin() {
    try {
        const user = await auth.createUser({
            email: ADMIN_MAIL,
            password: ADMIN_PASSWORD,
        });

        await auth.setCustomUserClaims(user.uid, { role: ADMIN });

        process.exit();
    } catch (err: any) {
        console.log(err.message ?? err);
        process.exit(1);
    }
})();
