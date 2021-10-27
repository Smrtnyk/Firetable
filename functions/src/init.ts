import * as admin from "firebase-admin";
import * as serviceAccount from "../service-account.json";

const params = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

const app = admin.initializeApp({
    projectId: params.projectId,
    credential: admin.credential.cert(params),
    storageBucket: "firetable-eu.appspot.com",
});

export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage().bucket();
