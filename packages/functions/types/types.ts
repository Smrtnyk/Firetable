import { BaseTable } from "@firetable/floor-creator";

export interface UpdatedTablesDifference {
    added: BaseTable[];
    removed: BaseTable[];
    updated: BaseTable[];
}

export const enum ChangeType {
    DELETE = "delete",
    ADD = "add"
}
