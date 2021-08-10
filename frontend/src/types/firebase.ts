import type firebase from "firebase/compat";

export type DocumentData = firebase.firestore.DocumentData;
export type QueryDocumentSnapshot<T> = firebase.firestore.QueryDocumentSnapshot;
export type Docref = firebase.firestore.DocumentReference<DocumentData>;
export type CollectionRef =
    firebase.firestore.CollectionReference<DocumentData>;

export const enum Collection {
    EVENTS = "events",
    GUEST_LIST = "guestList",
    USERS = "users",
    FLOORS = "floors",
    FCM = "fcm",
    EVENT_FEED = "eventFeed",
}
