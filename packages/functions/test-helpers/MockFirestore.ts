type FirestoreData = Record<string, any>;

const generateRandomId = (): string => Math.random().toString(36).substring(2, 15);

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

    runTransaction<T>(updateFunction: (transaction: MockTransaction) => Promise<T>): Promise<T> {
        const transaction = new MockTransaction(this);
        return updateFunction(transaction).then((result: T) => {
            return transaction.commit().then(() => result);
        });
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
        newDocRef.set(data);
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

    set(data: any): void {
        if (!data) {
            throw new Error("Data to set cannot be undefined");
        }
        this.db.data[this.path] = data;
    }

    get(): any {
        return this.db.data[this.path];
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

    get(docRef: MockDocumentReference): any {
        if (this.transactionData[docRef.path]) {
            return this.transactionData[docRef.path];
        }
        return docRef.get();
    }

    async commit(): Promise<void> {
        Object.entries(this.transactionData).forEach(([key, value]) => {
            this.db.data[key] = value;
        });
    }
}
