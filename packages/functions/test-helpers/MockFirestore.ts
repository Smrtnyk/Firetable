import { generateRandomId } from "./utils.js";

type FirestoreData = Record<string, any>;

export class MockFirestore {
    public data: FirestoreData;

    constructor() {
        this.data = {};
        this.collection = vi.fn(this.collection.bind(this));
    }

    collection(path: string): MockCollection {
        if (!this.data[path]) {
            this.data[path] = {};
        }
        return new MockCollection(path, this);
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
        return new MockDocumentReference(docPath, this.db, id);
    }

    async add(data: any): Promise<MockDocumentReference> {
        const id = generateRandomId();
        const docPath = `${this.path}/${id}`;
        const newDocRef = new MockDocumentReference(docPath, this.db, id);
        await newDocRef.set(data);
        return newDocRef;
    }
}

class MockDocumentReference {
    public path: string;
    public db: MockFirestore;
    public id: string;

    constructor(path: string, db: MockFirestore, id: string) {
        this.path = path;
        this.db = db;
        this.id = id;
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
        this.db.data[this.path] = { ...currentData, ...data };
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

    update(docRef: MockDocumentReference, data: any): void {
        const existingData = this.transactionData[docRef.path] || {};

        this.transactionData[docRef.path] = { ...existingData, ...data };
    }

    async commit(): Promise<void> {
        Object.entries(this.transactionData).forEach(([key, value]) => {
            this.db.data[key] = value;
        });
    }
}
