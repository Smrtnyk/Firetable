/* eslint-disable no-console -- cannot import frontend logger here */
import { register } from "register-service-worker";

declare const process: {
    env: {
        SERVICE_WORKER_FILE: string;
    };
};

register(process.env.SERVICE_WORKER_FILE, {
    ready() {
        console.log("Service worker is active.");
    },
    registered() {
        console.log("Service worker has been registered.");
    },
});
