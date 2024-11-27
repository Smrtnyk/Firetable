import type { Auth } from "firebase-admin/auth";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, afterEach, beforeAll } from "vitest";

const TEST_PROJECT_ID = `demo-test-project`;
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

beforeAll(async () => {
    await checkEmulators();
});

async function areEmulatorsRunning(): Promise<boolean> {
    try {
        // Try to connect to emulator UI port
        await fetch("http://localhost:3000");
        return true;
    } catch {
        return false;
    }
}

async function checkEmulators(): Promise<void> {
    const emulatorsRunning = await areEmulatorsRunning();

    if (emulatorsRunning) {
        console.log("Using existing emulator instance");
    } else {
        throw new Error("Emulators are not running");
    }
}

export async function clearAuth(auth: Auth): Promise<void> {
    const users = await auth.listUsers();
    await Promise.all(users.users.map((user) => auth.deleteUser(user.uid)));
}
