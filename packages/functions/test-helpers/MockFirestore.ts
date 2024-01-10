import { generateRandomId } from "./utils.js";

type FirestoreData = Record<string, any>;

export class MockFirestore {
    public data: FirestoreData;

    constructor() {
        this.data = {};
    }

    collection(path: string): MockCollection {
        const pathSegments = path.split("/");
        if (pathSegments.length % 2 === 0) {
            throw new Error(
                "Invalid collection path. Collection path must refer to a collection, not a document.",
            );
        }

        if (!this.data[path]) {
            this.data[path] = {};
        }
        return new MockCollection(path, this);
    }

    doc(path: string): MockDocumentReference {
        // Split the path and process it to get the final document path
        const pathSegments = path.split("/");
        if (pathSegments.length % 2 !== 0) {
            throw new Error("Document path must point to a document, not a collection.");
        }

        return new MockDocumentReference(path, this);
    }

    async runTransaction<T>(
        updateFunction: (transaction: MockTransaction) => Promise<T>,
    ): Promise<T> {
        const transaction = new MockTransaction(this);
        const result = await updateFunction(transaction);
        await transaction.commit();
        return result;
    }

    // Method to get data at a specific path
    getDataAtPath(path: string): any {
        return this.data[path];
    }
}

class MockCollection {
    private readonly path: string;
    private readonly db: MockFirestore;

    constructor(path: string, db: MockFirestore) {
        this.path = path;
        this.db = db;
    }

    doc(docId?: string): MockDocumentReference {
        const id = docId ?? generateRandomId();
        const docPath = `${this.path}/${id}`;
        return new MockDocumentReference(docPath, this.db);
    }

    async add(data: any): Promise<MockDocumentReference> {
        const id = generateRandomId();
        const docPath = `${this.path}/${id}`;
        const newDocRef = new MockDocumentReference(docPath, this.db);
        await newDocRef.set(data);
        return newDocRef;
    }

    where(fieldPath: string, opStr: string, value: any): MockQuerySnapshot {
        const matchingDocs: MockDocumentReference[] = [];

        Object.entries(this.db.data).forEach(([docPath, docData]) => {
            if (!docPath.startsWith(this.path)) {
                return;
            }
            let match = false;

            switch (opStr) {
                case "==":
                    match = docData[fieldPath] === value;
                    break;
                case "array-contains":
                    match = Array.isArray(docData[fieldPath]) && docData[fieldPath].includes(value);
                    break;
                default:
                    throw new Error(`Unsupported operator: ${opStr}`);
            }

            if (match) {
                matchingDocs.push(new MockDocumentReference(docPath, this.db));
            }
        });

        return new MockQuerySnapshot(matchingDocs);
    }
}

// Function to apply the update recursively
function applyUpdate(current: any, path: string[], value: any): void {
    const key: any = path[0];
    if (path.length === 1) {
        current[key] = value;
    } else {
        current[key] = current[key] || {};
        applyUpdate(current[key], path.slice(1), value);
    }
}

export class MockDocumentReference {
    public path: string;
    public db: MockFirestore;
    public id: string;

    constructor(path: string, db: MockFirestore) {
        this.path = path;
        this.db = db;
        this.id = path.split("/").pop() ?? "";
    }

    async set(data: any): Promise<void> {
        if (!data) {
            throw new Error("Data to set cannot be undefined");
        }
        this.db.data[this.path] = data;
    }

    async get(): Promise<{ exists: boolean; data?: () => any }> {
        const data = this.db.data[this.path];
        return {
            exists: data !== undefined,
            data: () => data,
        };
    }

    getId(): string {
        return this.id;
    }

    collection(subPath: string): MockCollection {
        const fullPath = `${this.path}/${subPath}`;
        return new MockCollection(fullPath, this.db);
    }

    update(data: any): Promise<void> {
        const currentData = this.db.data[this.path] || {};

        Object.keys(data).forEach((key) => {
            const dataValue = data[key];
            const isObject = typeof dataValue === "object" && dataValue !== null;
            // Handle arrayUnion and arrayRemove operations
            if (isObject && data[key].arrayUnion) {
                currentData[key] = currentData[key] || [];
                data[key].elements.forEach((element: any) => {
                    if (!currentData[key].includes(element)) {
                        currentData[key].push(element);
                    }
                });
            } else if (isObject && data[key].arrayRemove) {
                if (currentData[key]) {
                    data[key].elements.forEach((element: any) => {
                        const index = currentData[key].indexOf(element);
                        if (index > -1) {
                            currentData[key].splice(index, 1);
                        }
                    });
                }
            } else {
                // Handle normal updates
                const path = key.split(".");
                applyUpdate(currentData, path, data[key]);
            }
        });

        this.db.data[this.path] = currentData;
        return Promise.resolve();
    }

    async delete(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- this is intentional
        delete this.db.data[this.path];
    }
}

class MockTransaction {
    private transactionData: FirestoreData = {};
    private db: MockFirestore;

    constructor(db: MockFirestore) {
        this.db = db;
    }

    set(docRef: MockDocumentReference, data: any): void {
        this.transactionData[docRef.path] = data;
    }

    async get(docRef: MockDocumentReference): Promise<{ exists: boolean; data?: () => any }> {
        if (this.transactionData[docRef.path]) {
            return {
                exists: true,
                data: () => this.transactionData[docRef.path],
            };
        }

        // Fallback to get from MockDocumentReference if not in transactionData
        return docRef.get();
    }

    async update(docRef: MockDocumentReference, data: any): Promise<void> {
        const existingData =
            this.transactionData[docRef.path] || (await docRef.get()).data?.() || {};

        Object.keys(data).forEach((key) => {
            const dataValue = data[key];
            const isObject = typeof dataValue === "object" && dataValue !== null;

            if (isObject && dataValue.arrayUnion) {
                existingData[key] = existingData[key] || [];
                dataValue.elements.forEach((element: any) => {
                    if (!existingData[key].includes(element)) {
                        existingData[key].push(element);
                    }
                });
            } else if (isObject && dataValue.arrayRemove) {
                if (existingData[key]) {
                    dataValue.elements.forEach((element: any) => {
                        const index = existingData[key].indexOf(element);
                        if (index > -1) {
                            existingData[key].splice(index, 1);
                        }
                    });
                }
            } else {
                const path = key.split(".");
                applyUpdate(existingData, path, data[key]);
            }
        });

        this.transactionData[docRef.path] = existingData;
    }

    async commit(): Promise<void> {
        Object.entries(this.transactionData).forEach(([key, value]) => {
            this.db.data[key] = value;
        });
    }
}

class MockQuerySnapshot {
    constructor(private docs: MockDocumentReference[]) {}

    async get(): Promise<MockQuerySnapshot> {
        // Simulate fetching documents from Firestore
        const docs = await Promise.all(this.docs.map((docRef) => docRef.get()));
        // Filter out non-existing documents
        const existingDocs = docs
            .filter((doc) => doc.exists)
            .map((doc, idx) => ({
                id: this.docs[idx]?.getId(),
                data: () => doc.data,
            }));

        return new MockQuerySnapshot(existingDocs as any);
    }
}
