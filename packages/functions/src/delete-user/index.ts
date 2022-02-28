import { auth, db } from "../init";
import { Collection } from "@firetable/types";

export function deleteUser(id: string): Promise<[void, any]> {
    return Promise.all([
        auth.deleteUser(id),
        db.collection(`${Collection.USERS}`).doc(id).delete()
    ]);
}
