import { auth, db } from "../init";
import { Collection } from "../../types/database";

export function deleteUser(id: string): Promise<[void, any]> {
    return Promise.all([
        auth.deleteUser(id),
        db.collection(`${Collection.USERS}`).doc(id).delete()
    ]);
}
