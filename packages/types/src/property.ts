import { QueryDocumentSnapshot } from "firebase/firestore";

export interface PropertyDoc {
    id: string;
    name: string;
    img?: string;
    _doc: QueryDocumentSnapshot<PropertyDoc>;
}

export interface UserPropertyMapDoc {
    userId: string;
    propertyId: string;
}
