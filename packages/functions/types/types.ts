import { BaseTable } from "@firetable/floorcreator";

export interface UpdatedTablesDifference {
    added: BaseTable[];
    removed: BaseTable[];
    updated: BaseTable[];
}

export const enum ChangeType {
    DELETE = "delete",
    ADD = "add"
}
