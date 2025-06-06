import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, afterEach } from "vitest";

const TEST_PROJECT_ID = `demo-project`;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:4000";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;

const testEnvironment = await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
});

afterEach(async () => {
    try {
        await testEnvironment.clearFirestore();
    } catch (e) {
        console.error(e);
    }
});

afterAll(async () => {
    try {
        await testEnvironment.cleanup();
    } catch (e) {
        console.error(e);
    }
});
