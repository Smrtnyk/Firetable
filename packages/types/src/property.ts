import type { QueryDocumentSnapshot } from "firebase/firestore";

export interface PropertyDoc {
    id: string;
    name: string;
    organisationId: string;
    relatedUsers: string[];
    img?: string;
    _doc: QueryDocumentSnapshot<PropertyDoc>;
}
