import type { Timestamp } from "firebase/firestore";

export * from "./firebase.js";
export type * from "./event.js";
export type * from "./floor.js";
export * from "./auth.js";
export type * from "./property.js";
export type * from "./organisation.js";
export type * from "./guest.js";
export type * from "./utils.js";
export * from "./queued-reservation.js";
export * from "./base-reservation.js";
export * from "./reservation.js";
export * from "./walk-in-reservation.js";
export * from "./planned-reservation.js";
export * from "./inventory.js";

export type FirestoreTimestamp = Timestamp;
