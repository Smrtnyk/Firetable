import { fcm } from "./db.js";
import { addDoc } from "firebase/firestore";

export function savePushSubscription(subscription: PushSubscriptionJSON) {
    return addDoc(fcm(), subscription);
}
