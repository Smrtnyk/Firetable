import { QueryDocumentSnapshot } from "firebase/firestore";

export interface PropertyDoc {
    id: string;
    name: string;
    relatedUsers: string[];
    img?: string;
    _doc: QueryDocumentSnapshot<PropertyDoc>;
}
