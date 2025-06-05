const EMULATOR_HOST = "localhost";
const FIRESTORE_PORT = 4000;
const AUTH_PORT = 9099;

export async function verifyEmulatorConnection(): Promise<void> {
    const firestoreUrl = `http://${EMULATOR_HOST}:${FIRESTORE_PORT}/`;
    const authUrl = `http://${EMULATOR_HOST}:${AUTH_PORT}/`;

    const [firestoreRunning, authRunning] = await Promise.all([
        checkEndpoint(firestoreUrl),
        checkEndpoint(authUrl),
    ]);

    if (!firestoreRunning || !authRunning) {
        throw new Error(
            "ERROR: Firebase emulators not running!\n" +
                "Please start the emulators with: pnpm start:emulators",
        );
    }
}

async function checkEndpoint(url: string): Promise<boolean> {
    try {
        const response = await fetch(url);
        return response.status !== 404;
    } catch {
        return false;
    }
}
