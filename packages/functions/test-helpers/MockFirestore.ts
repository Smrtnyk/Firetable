import type {
    FieldPath,
    FieldValue,
    Query,
    OrderByDirection,
    WhereFilterOp,
    DocumentSnapshot,
    Settings,
    ReadOptions,
} from "firebase-admin/firestore";
import { FirestoreOperation } from "./types.js";
import { generateRandomId } from "./utils.js";
import { Timestamp } from "firebase-admin/firestore";

type FirestoreData = Map<string, any>;

export class MockFirestore {
    public data: FirestoreData;
    private _settings: Settings;

    constructor(settings: Settings = {}) {
        this.data = new Map();
        this._settings = settings;
    }

    terminate(): Promise<void> {
        this.data.clear();
        return Promise.resolve();
    }

    settings(settings: Settings): void {
        this._settings = settings;
        console.log(this._settings);
    }

    async getAll(
        ...documentRefsOrReadOptions: Array<MockDocumentReference | ReadOptions>
    ): Promise<MockDocumentSnapshot[]> {
        // collect all document references
        const documentRefs = documentRefsOrReadOptions.filter(
            (ref): ref is MockDocumentReference => ref instanceof MockDocumentReference,
        );
        return Promise.all(documentRefs.map((ref) => ref.get()));
    }

    recursiveDelete(...args: any[]): any {
        console.log("MockFirestore.recursiveDelete", args);
        throw new NotImplementedError("recursiveDelete is not implemented");
    }

    bulkWriter(...args: any[]): any {
        console.log("MockFirestore.bulkWriter", args);
        throw new NotImplementedError("bulkWriter is not implemented");
    }

    bundle(...args: any[]): any {
        console.log("MockFirestore.bundle", args);
        throw new NotImplementedError("bundle is not implemented");
    }

    batch(): MockWriteBatch {
        return new MockWriteBatch();
    }

    collectionGroup(collectionId: string): any {
        console.log("MockFirestore.collectionGroup", collectionId);
        throw new NotImplementedError("collectionGroup is not implemented");
    }

    collection(path: string): MockCollection {
        const pathSegments = path.split("/");
        if (pathSegments.length % 2 === 0) {
            throw new Error("Invalid collection path. Must refer to a collection, not a document.");
        }

        return new MockCollection(path, this);
    }

    doc(path: string): MockDocumentReference {
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
        return this.data.get(path);
    }
}

export class MockCollection {
    readonly path: string;
    readonly firestore: MockFirestore;

    constructor(path: string, firestore: MockFirestore) {
        this.path = path;
        this.firestore = firestore;
    }

    isEqual(other: MockCollection): boolean {
        console.log("MockCollection.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }

    async listDocuments(): Promise<MockDocumentReference[]> {
        return Array.from(this.firestore.data.keys())
            .filter(
                (path) =>
                    path.startsWith(this.path) &&
                    path.split("/").length === this.path.split("/").length + 1,
            )
            .map((docPath) => new MockDocumentReference(docPath, this.firestore));
    }

    limit(n: number): MockQuery {
        const query = new MockQuery(this);
        return query.limit(n);
    }

    async get(): Promise<MockQuerySnapshot> {
        const expectedDepth = this.path.split("/").length + 1;
        const docs = Array.from(this.firestore.data.entries())
            .filter(
                ([docPath]) =>
                    docPath.startsWith(this.path) && docPath.split("/").length === expectedDepth,
            )
            .map(async ([docPath]) => {
                const ref = new MockDocumentReference(docPath, this.firestore);
                const data = await ref.get();
                return new MockQueryDocumentSnapshot(ref, data.exists, data.data());
            });
        const snapshots = await Promise.all(docs);

        return new MockQuerySnapshot(snapshots);
    }

    doc(docId?: string): MockDocumentReference {
        const id = docId ?? generateRandomId();
        const docPath = `${this.path}/${id}`;
        return new MockDocumentReference(docPath, this.firestore);
    }

    async add(data: any): Promise<MockDocumentReference> {
        const id = generateRandomId();
        const docPath = `${this.path}/${id}`;
        const newDocRef = new MockDocumentReference(docPath, this.firestore);
        await newDocRef.set(data);
        return newDocRef;
    }

    where(fieldPath: string | MockFieldPath, opStr: WhereFilterOp, value: any): MockQuery {
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
        current[key] = current[key] ?? {};
        applyUpdate(current[key], path.slice(1), value);
    }
}

export class MockDocumentReference {
    public path: string;
    public firestore: MockFirestore;
    public id: string;

    constructor(path: string, firestore: MockFirestore) {
        this.path = path;
        this.firestore = firestore;
        this.id = path.split("/").pop() ?? "";
    }

    async listCollections(): Promise<MockCollection[]> {
        const subCollectionPaths = new Set<string>();
        const docPathDepth = this.path.split("/").length;

        for (const path of this.firestore.data.keys()) {
            if (path.startsWith(this.path) && path.split("/").length > docPathDepth) {
                const subCollectionPath = path
                    .split("/")
                    .slice(0, docPathDepth + 1)
                    .join("/");
                subCollectionPaths.add(subCollectionPath);
            }
        }

        return Array.from(subCollectionPaths).map(
            (collPath) => new MockCollection(collPath, this.firestore),
        );
    }

    async set(data: any): Promise<MockWriteResult> {
        if (!data) {
            throw new Error("Data to set cannot be undefined");
        }
        this.firestore.data.set(this.path, data);
        return new MockWriteResult();
    }

    async get(): Promise<MockDocumentSnapshot> {
        const data = this.firestore.data.get(this.path);
        return new MockDocumentSnapshot(this, data !== undefined, data);
    }

    collection(subPath: string): MockCollection {
        const fullPath = `${this.path}/${subPath}`;
        return new MockCollection(fullPath, this.firestore);
    }

    update(data: any): Promise<MockWriteResult> {
        const currentData = this.firestore.data.get(this.path) ?? {};

        Object.keys(data).forEach((key) => {
            if (data[key] instanceof MockFieldValue) {
                currentData[key] = data[key].applyTo(currentData[key]);
            } else {
                // Handle normal updates
                const path = key.split(".");
                applyUpdate(currentData, path, data[key]);
            }
        });

        this.firestore.data.set(this.path, currentData);
        return Promise.resolve(new MockWriteResult());
    }

    async delete(): Promise<MockWriteResult> {
        this.firestore.data.delete(this.path);
        return new MockWriteResult();
    }
}

class MockTransaction {
    private transactionData: FirestoreData = new Map<string, any>();
    private db: MockFirestore;

    constructor(db: MockFirestore) {
        this.db = db;
    }

    set(docRef: MockDocumentReference, data: any): MockTransaction {
        this.transactionData.set(docRef.path, data);
        return this;
    }

    async get(docRef: MockDocumentReference): Promise<MockDocumentSnapshot> {
        const data = this.transactionData.get(docRef.path);
        return new MockDocumentSnapshot(docRef, !!data, data);
    }

    async update(docRef: MockDocumentReference, data: any): Promise<void> {
        const existingData =
            this.transactionData.get(docRef.path) ?? (await docRef.get()).data?.() ?? {};

        Object.keys(data).forEach((key) => {
            const dataValue = data[key];

            if (dataValue instanceof MockFieldValue) {
                existingData[key] = data[key].applyTo(existingData[key]);
            } else {
                const path = key.split(".");
                applyUpdate(existingData, path, data[key]);
            }
        });

        this.transactionData.set(docRef.path, existingData);
    }

    async commit(): Promise<void> {
        Array.from(this.transactionData.entries()).forEach(([key, value]) => {
            this.db.data.set(key, value);
        });
    }
}

export class MockDocumentSnapshot {
    createTime?: Timestamp;
    updateTime?: Timestamp;
    readTime = Timestamp.now();

    /**
     * @private
     */
    readonly #data: any;

    constructor(
        public readonly ref: any,
        public readonly exists: boolean,
        data: any,
    ) {
        this.#data = data;
    }

    get id(): string {
        return this.ref.id;
    }

    data(): any | undefined {
        return this.exists ? this.#data : undefined;
    }

    get(fieldPath: string | FieldPath): any {
        if (!this.exists) {
            return undefined;
        }

        const pathString = typeof fieldPath === "string" ? fieldPath : fieldPath.toString();

        const fields = pathString.split(".");
        let currentObject = this.#data;
        for (const field of fields) {
            if (!(field in currentObject)) {
                return undefined;
            }
            currentObject = currentObject[field];
        }
        return currentObject;
    }

    isEqual(other: DocumentSnapshot): boolean {
        console.log("MockDocumentSnapshot.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }
}

export class MockQueryDocumentSnapshot extends MockDocumentSnapshot {
    override createTime = Timestamp.now();
    override updateTime = Timestamp.now();
}

class MockQuerySnapshot {
    size = 0;
    query: any;
    empty = false;
    readTime = Timestamp.now();

    constructor(public docs: MockQueryDocumentSnapshot[]) {}

    docChanges(): any {
        console.log("MockQuerySnapshot.docChanges");
        throw new NotImplementedError("docChanges is not implemented");
    }

    isEqual(other: any): boolean {
        console.log("MockQuerySnapshot.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }

    forEach(callback: (doc: any) => void): void {
        this.docs.forEach((doc) => callback(doc));
    }
}

export class MockFieldValue implements FieldValue {
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
            const set = new Set(currentValue ?? []);
            this.elements.forEach((element) => set.add(element));
            return Array.from(set);
        } else if (this.operation === "arrayRemove") {
            // Filter out elements to be removed from the current value
            return (currentValue ?? []).filter((item: any) => !this.elements.includes(item));
        }
    }

    isEqual(other: FieldValue): boolean {
        console.log("MockFieldValue.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }
}

export class MockFieldPath implements FieldPath {
    private constructor(private fieldPath: string) {}

    static documentId(): MockFieldPath {
        return new MockFieldPath("__name__"); // A special identifier for document ID
    }

    toString(): string {
        return this.fieldPath;
    }

    isEqual(other: FieldPath): boolean {
        console.log("MockFieldPath.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }
}

class MockQuery implements Query {
    private readonly _initPromise: Promise<void>;
    private queryConstraints: any[] = [];
    private docs: MockQueryDocumentSnapshot[] = [];
    firestore: any;

    constructor(private collection: MockCollection) {
        this._initPromise = this.init();
    }

    async init(): Promise<void> {
        const docsPromise = Array.from(this.collection.firestore.data.entries())
            .filter(([docPath]) => docPath.startsWith(this.collection.path))
            .map(([docPath]) => new MockDocumentReference(docPath, this.collection.firestore))
            .map((docRef) => {
                return docRef.get();
            });
        const docsSnaps = await Promise.all(docsPromise);
        this.docs = docsSnaps.map((snap) => {
            return new MockQueryDocumentSnapshot(snap.ref, snap.exists, snap.data());
        });
    }

    withConverter(): any {
        console.log("MockQuery.withConverter");
        throw new NotImplementedError("withConverter is not implemented");
    }

    stream(): any {
        console.log("MockQuery.stream");
        throw new NotImplementedError("stream is not implemented");
    }

    count(): any {
        console.log("MockQuery.count");
        throw new NotImplementedError("count is not implemented");
    }

    onSnapshot(...args: any[]): any {
        console.log("MockQuery.onSnapshot", args);
        throw new NotImplementedError("onSnapshot is not implemented");
    }

    aggregate(...args: any[]): any {
        console.log("MockQuery.aggregate", args);
        throw new NotImplementedError("aggregate is not implemented");
    }

    endBefore(...args: any[]): any {
        console.log("MockQuery.endBefore", args);
        throw new NotImplementedError("endBefore is not implemented");
    }

    endAt(...args: any[]): any {
        console.log("MockQuery.endAt", args);
        throw new NotImplementedError("endAt is not implemented");
    }

    select(...field: (string | MockFieldPath)[]): any {
        console.log("MockQuery.select", field);
        throw new NotImplementedError("select is not implemented");
    }

    startAfter(...args: any[]): any {
        console.log("MockQuery.startAfter", args);
        throw new NotImplementedError("startAfter is not implemented");
    }

    startAt(...args: any[]): any {
        console.log("MockQuery.startAt", args);
        throw new NotImplementedError("startAt is not implemented");
    }

    offset(offset: number): any {
        console.log("MockQuery.offset", offset);
        throw new NotImplementedError("offset is not implemented");
    }

    limitToLast(limit: number): any {
        console.log("MockQuery.limitToLast", limit);
        throw new NotImplementedError("limitToLast is not implemented");
    }

    orderBy(fieldPath: string | MockFieldPath, directionStr?: OrderByDirection): any {
        console.log("MockQuery.orderBy", fieldPath, directionStr);
        throw new NotImplementedError("orderBy is not implemented");
    }

    where(
        filterOrFieldPath: any | string | MockFieldPath,
        opStr?: WhereFilterOp,
        value?: any,
    ): MockQuery {
        if (!opStr && !value) {
            throw new NotImplementedError("where for filter is not implemented");
        }
        if (filterOrFieldPath instanceof MockFieldPath) {
            filterOrFieldPath = filterOrFieldPath.toString();
        }
        this.queryConstraints.push({ type: "where", fieldPath: filterOrFieldPath, opStr, value });
        return this;
    }

    limit(n: number): MockQuery {
        this.queryConstraints.push({ type: "limit", value: n });
        return this;
    }

    isEqual(other: any): boolean {
        console.log("MockQuery.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }

    async get(): Promise<MockQuerySnapshot> {
        await this._initPromise;
        let filteredDocs = this.docs;

        for (const constraint of this.queryConstraints) {
            if (constraint.type === "where") {
                filteredDocs = filteredDocs.filter((docRef) => {
                    // Special handling for document ID
                    if (constraint.fieldPath === "__name__") {
                        return constraint.opStr === "in" && constraint.value.includes(docRef.id);
                    } else {
                        const docData = docRef.data();
                        switch (constraint.opStr) {
                            case "==":
                                return docData[constraint.fieldPath] === constraint.value;
                            case "<=":
                                return docData[constraint.fieldPath] <= constraint.value;
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

export class MockWriteBatch {
    private operations: { type: FirestoreOperation; docRef: MockDocumentReference; data?: any }[] =
        [];

    set(docRef: MockDocumentReference, data: any): MockWriteBatch {
        this.operations.push({ type: FirestoreOperation.SET, docRef, data });
        return this;
    }

    update(docRef: MockDocumentReference, data: any): MockWriteBatch {
        this.operations.push({ type: FirestoreOperation.UPDATE, docRef, data });
        return this;
    }

    delete(docRef: MockDocumentReference): MockWriteBatch {
        this.operations.push({ type: FirestoreOperation.DELETE, docRef });
        return this;
    }

    async commit(): Promise<MockWriteResult[]> {
        for (const operation of this.operations) {
            if (operation.type === FirestoreOperation.SET) {
                await operation.docRef.set(operation.data);
            } else if (operation.type === FirestoreOperation.UPDATE) {
                await operation.docRef.update(operation.data);
            } else if (operation.type === FirestoreOperation.DELETE) {
                await operation.docRef.delete();
            } else {
                throw new Error(`Unsupported operation: ${operation.type}`);
            }
        }

        return [new MockWriteResult()];
    }
}

export class MockWriteResult {
    readonly writeTime = Timestamp.now();

    isEqual(other: MockWriteResult): boolean {
        console.log("MockWriteResult.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }
}

class NotImplementedError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
    }
}
