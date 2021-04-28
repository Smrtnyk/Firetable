import { fcm } from "./db";

export function savePushSubscription(subscription: PushSubscriptionJSON) {
    return fcm().add(subscription);
}
