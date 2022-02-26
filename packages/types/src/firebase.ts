export const enum Collection {
    EVENTS = "events",
    GUEST_LIST = "guestList",
    USERS = "users",
    FLOORS = "floors",
    FCM = "fcm",
    EVENT_FEED = "eventFeed",
    SETTINGS = "settings",
}

export interface PushSubscriptionDoc {
    id: string;
    endpoint: string;
    expirationTime: null | Date;
    keys: {
        auth: string;
        p256dh: string;
    };
}
