import { QueryDocumentSnapshot } from "firebase/firestore";

export interface ClubDoc {
    id: string;
    ownerId: string;
    name: string;
    img?: string;
    _doc: QueryDocumentSnapshot<ClubDoc>;
}
