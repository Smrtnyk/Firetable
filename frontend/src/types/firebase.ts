import {
    DocumentData,
    DocumentReference,
    CollectionReference,
} from "@firebase/firestore";
export type Docref = DocumentReference<DocumentData>;
export type CollectionRef = CollectionReference<DocumentData>;

export const enum Collection {
    EVENTS = "events",
    GUEST_LIST = "guestList",
    USERS = "users",
    FLOORS = "floors",
    FCM = "fcm",
    EVENT_FEED = "eventFeed",
}
