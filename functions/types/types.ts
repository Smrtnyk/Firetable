import { TableElement } from "./floor";

export interface UpdatedTablesDifference {
    added: TableElement[];
    removed: TableElement[];
    updated: TableElement[];
}

export interface PushSubscriptionDoc {
    id: string;
    endpoint: string;
    expirationTime: null|Date;
    keys: {
        auth: string;
        p256dh: string;
    };
}

export const enum ChangeType {
    DELETE = "delete",
    ADD = "add"
}
