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
    readonly path: string;
    readonly db: MockFirestore;

    constructor(path: string, db: MockFirestore) {
        this.path = path;
        this.db = db;
    }

    // Method to list all document references in the collection
    async listDocuments(): Promise<MockDocumentReference[]> {
        return Object.keys(this.db.data)
            .filter(
                (path) =>
                    path.startsWith(this.path) &&
                    path.split("/").length === this.path.split("/").length + 1,
            )
            .map((docPath) => new MockDocumentReference(docPath, this.db));
    }

    limit(n: number): MockQuery {
        const query = new MockQuery(this);
        return query.limit(n);
    }

    async get(): Promise<MockQuerySnapshot> {
        const docs: MockDocumentReference[] = Object.entries(this.db.data)
            .filter(([docPath]) => docPath.startsWith(this.path))
            .map(([docPath]) => new MockDocumentReference(docPath, this.db));

        return new MockQuerySnapshot(docs);
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

    where(fieldPath: string | MockFieldPath, opStr: string, value: any): MockQuery {
        // Initialize a new MockQuery with the collection reference
        return new MockQuery(this).where(fieldPath, opStr, value);
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

    async listCollections(): Promise<MockCollection[]> {
        const subCollectionPaths = new Set<string>();
        const docPathDepth = this.path.split("/").length;

        for (const path in this.db.data) {
            if (path.startsWith(this.path) && path.split("/").length > docPathDepth) {
                const subCollectionPath = path
                    .split("/")
                    .slice(0, docPathDepth + 1)
                    .join("/");
                subCollectionPaths.add(subCollectionPath);
            }
        }

        return Array.from(subCollectionPaths).map(
            (collPath) => new MockCollection(collPath, this.db),
        );
    }

    data(): any {
        return this.db.data[this.path];
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
            if (data[key] instanceof MockFieldValue) {
                currentData[key] = data[key].applyTo(currentData[key]);
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

            if (dataValue instanceof MockFieldValue) {
                existingData[key] = data[key].applyTo(existingData[key]);
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
    constructor(public docs: MockDocumentReference[]) {}

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

export class MockFieldValue {
    private constructor(
        private operation: "arrayUnion" | "arrayRemove",
        private elements: any[],
    ) {}

    static arrayUnion(...elements: any[]): MockFieldValue {
        return new MockFieldValue("arrayUnion", elements);
    }

    static arrayRemove(...elements: any[]): MockFieldValue {
        return new MockFieldValue("arrayRemove", elements);
    }

    applyTo(currentValue: any): any {
        if (this.operation === "arrayUnion") {
            // Combine the current value with new elements, ensuring uniqueness
            const set = new Set(currentValue || []);
            this.elements.forEach((element) => set.add(element));
            return Array.from(set);
        } else if (this.operation === "arrayRemove") {
            // Filter out elements to be removed from the current value
            return (currentValue || []).filter((item: any) => !this.elements.includes(item));
        }
    }
}

export class MockFieldPath {
    private constructor(private fieldPath: string) {}

    static documentId(): MockFieldPath {
        return new MockFieldPath("__name__"); // A special identifier for document ID
    }

    toString(): string {
        return this.fieldPath;
    }
}

class MockQuery {
    private queryConstraints: any[] = [];
    private docs: MockDocumentReference[];

    constructor(private collection: MockCollection) {
        this.docs = this.initializeDocs();
    }

    private initializeDocs(): MockDocumentReference[] {
        return Object.entries(this.collection.db.data)
            .filter(([docPath]) => docPath.startsWith(this.collection.path))
            .map(([docPath]) => new MockDocumentReference(docPath, this.collection.db));
    }

    where(fieldPath: string | MockFieldPath, opStr: string, value: any): MockQuery {
        if (fieldPath instanceof MockFieldPath) {
            fieldPath = fieldPath.toString();
        }
        this.queryConstraints.push({ type: "where", fieldPath, opStr, value });
        return this;
    }

    limit(n: number): MockQuery {
        this.queryConstraints.push({ type: "limit", value: n });
        return this;
    }

    async get(): Promise<MockQuerySnapshot> {
        let filteredDocs = this.docs;

        for (const constraint of this.queryConstraints) {
            if (constraint.type === "where") {
                filteredDocs = filteredDocs.filter((docRef) => {
                    // Special handling for document ID
                    if (constraint.fieldPath === "__name__") {
                        return (
                            constraint.opStr === "in" && constraint.value.includes(docRef.getId())
                        );
                    } else {
                        const docData = docRef.data();
                        switch (constraint.opStr) {
                            case "==":
                                return docData[constraint.fieldPath] === constraint.value;
                            case "array-contains":
                                return (
                                    Array.isArray(docData[constraint.fieldPath]) &&
                                    docData[constraint.fieldPath].includes(constraint.value)
                                );
                            case "in":
                                return (
                                    Array.isArray(constraint.value) &&
                                    constraint.value.includes(docData[constraint.fieldPath])
                                );
                            default:
                                throw new Error(`Unsupported operator: ${constraint.opStr}`);
                        }
                    }
                });
            } else if (constraint.type === "limit") {
                filteredDocs = filteredDocs.slice(0, constraint.value);
            }
        }

        return new MockQuerySnapshot(filteredDocs);
    }
}
