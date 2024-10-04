import type {
    FieldPath,
    FieldValue,
    Query,
    OrderByDirection,
    WhereFilterOp,
    DocumentSnapshot,
    Settings,
    ReadOptions,
    CollectionReference,
    DocumentReference,
} from "firebase-admin/firestore";
import { FirestoreOperation } from "./types.js";
import { generateRandomId } from "./utils.js";
import { Timestamp } from "firebase-admin/firestore";

type FirestoreData = Map<string, any>;

export class MockFirestore {
    public data: FirestoreData;
    private readonly versions: Map<string, number> = new Map();
    #settings: Settings;

    constructor(settings: Settings = {}) {
        this.data = new Map();
        this.#settings = settings;
    }

    getVersion(path: string): number {
        return this.versions.get(path) ?? 0;
    }

    incrementVersion(path: string): void {
        const currentVersion = this.getVersion(path);
        this.versions.set(path, currentVersion + 1);
    }

    terminate(): Promise<void> {
        this.data.clear();
        return Promise.resolve();
    }

    settings(settings: Settings): void {
        this.#settings = settings;
        console.log(this.#settings);
    }

    getAll(
        ...documentRefsOrReadOptions: Array<MockDocumentReference | ReadOptions>
    ): Promise<MockDocumentSnapshot[]> {
        // collect all document references
        const documentRefs = documentRefsOrReadOptions.filter(
            (ref): ref is MockDocumentReference => ref instanceof MockDocumentReference,
        );
        return Promise.all(documentRefs.map((ref) => ref.get()));
    }

    async recursiveDelete(collectionRef: MockCollection): Promise<void> {
        const docs = await collectionRef.listDocuments();
        for (const doc of docs) {
            const subcollections = await doc.listCollections();
            for (const subcollection of subcollections) {
                await this.recursiveDelete(subcollection);
            }
            await doc.delete();
        }
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

    collectionGroup(collectionId: string): MockQuery {
        return new MockQuery(null, this, collectionId);
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

export class MockCollection implements CollectionReference {
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

    listDocuments(): Promise<MockDocumentReference[]> {
        const docs = Array.from(this.firestore.data.keys())
            .filter((path) => {
                return (
                    path.startsWith(this.path) &&
                    path.split("/").length === this.path.split("/").length + 1
                );
            })
            .map((docPath) => new MockDocumentReference(docPath, this.firestore));
        return Promise.resolve(docs);
    }

    limit(n: number): MockQuery {
        const query = new MockQuery(this, this.firestore);
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

    where(fieldPath: MockFieldPath | string, opStr: WhereFilterOp, value: any): MockQuery {
        return new MockQuery(this, this.firestore).where(fieldPath, opStr, value);
    }

    orderBy(fieldPath: MockFieldPath | string, directionStr: OrderByDirection = "asc"): MockQuery {
        return new MockQuery(this, this.firestore).orderBy(fieldPath, directionStr);
    }
}

function applyUpdate(current: any, path: string[], value: any): void {
    const key = path[0];
    if (path.length === 1) {
        current[key] = value;
    } else {
        current[key] = current[key] ?? {};
        applyUpdate(current[key], path.slice(1), value);
    }
}

export class MockDocumentReference implements DocumentReference {
    public path: string;
    public firestore: MockFirestore;
    public id: string;
    private listeners: Array<(snapshot: MockDocumentSnapshot) => void> = [];

    constructor(path: string, firestore: MockFirestore) {
        this.path = path;
        this.firestore = firestore;
        this.id = path.split("/").pop() ?? "";
    }

    onSnapshot(
        onNext: (snapshot: MockDocumentSnapshot) => void,
        onError?: (error: Error) => void,
    ): () => void {
        this.listeners.push(onNext);
        (async function (instance) {
            try {
                const snapshot = await instance.get();
                onNext(snapshot);
            } catch (error) {
                if (onError) onError(error);
            }
        })(this);

        return () => {
            this.listeners = this.listeners.filter((listener) => listener !== onNext);
        };
    }

    listCollections(): Promise<MockCollection[]> {
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

        const cols = Array.from(subCollectionPaths).map(
            (collPath) => new MockCollection(collPath, this.firestore),
        );
        return Promise.resolve(cols);
    }

    async set(
        data: any,
        options?: { merge?: boolean; mergeFields?: (FieldPath | string)[] },
    ): Promise<MockWriteResult> {
        if (!data) {
            throw new Error("Data to set cannot be undefined");
        }

        if (options?.merge) {
            const existingData = this.firestore.data.get(this.path) ?? {};
            const mergedData = deepMerge(existingData, data);
            this.firestore.data.set(this.path, mergedData);
        } else {
            this.firestore.data.set(this.path, data);
        }

        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        return new MockWriteResult();
    }

    get(): Promise<MockDocumentSnapshot> {
        const data = this.firestore.data.get(this.path);
        return Promise.resolve(new MockDocumentSnapshot(this, data !== undefined, data));
    }

    collection(subPath: string): MockCollection {
        const fullPath = `${this.path}/${subPath}`;
        return new MockCollection(fullPath, this.firestore);
    }

    async update(data: any): Promise<MockWriteResult> {
        const currentData = this.firestore.data.get(this.path);

        if (!currentData) {
            throw new FirestoreError(
                "not-found",
                `No document to update: Document at path '${this.path}' does not exist.`,
            );
        }

        Object.keys(data).forEach((key) => {
            const value = data[key];
            const path = key.split(".");

            if (value instanceof MockFieldValue) {
                let parent = currentData;
                for (let i = 0; i < path.length - 1; i++) {
                    parent = parent[path[i]] = parent[path[i]] ?? {};
                }
                const lastKey = path[path.length - 1];

                if (value.operation === "delete") {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keep like this for now
                    delete parent[lastKey];
                } else {
                    const currentValue = parent[lastKey];
                    const newValue = value.applyTo(currentValue);
                    parent[lastKey] = newValue;
                }
            } else {
                applyUpdate(currentData, path, value);
            }
        });

        this.firestore.data.set(this.path, currentData);
        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        return new MockWriteResult();
    }

    async delete(): Promise<MockWriteResult> {
        this.firestore.data.delete(this.path);
        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        return new MockWriteResult();
    }

    private async notifyListeners(): Promise<void> {
        const snapshot = await this.get();
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
}

class MockTransaction {
    private readonly readVersions: Map<string, number> = new Map();
    private readonly writes: Map<string, any> = new Map();
    private readonly firestore: MockFirestore;

    constructor(firestore: MockFirestore) {
        this.firestore = firestore;
    }

    get(docRef: MockDocumentReference): Promise<MockDocumentSnapshot> {
        const data = this.writes.get(docRef.path) ?? this.firestore.getDataAtPath(docRef.path);
        this.readVersions.set(docRef.path, this.firestore.getVersion(docRef.path));
        return Promise.resolve(new MockDocumentSnapshot(docRef, data !== undefined, data));
    }

    set(docRef: MockDocumentReference, data: any): this {
        this.writes.set(docRef.path, data);
        return this;
    }

    update(docRef: MockDocumentReference, data: any): this {
        const currentData =
            this.writes.get(docRef.path) ?? this.firestore.getDataAtPath(docRef.path) ?? {};

        Object.keys(data).forEach((key) => {
            const value = data[key];
            const path = key.split(".");

            if (value instanceof MockFieldValue) {
                let parent = currentData;
                for (let i = 0; i < path.length - 1; i++) {
                    parent = parent[path[i]] = parent[path[i]] ?? {};
                }
                const lastKey = path[path.length - 1];

                if (value.operation === "delete") {
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keep like this for now
                    delete parent[lastKey];
                } else {
                    const currentValue = parent[lastKey];
                    const newValue = value.applyTo(currentValue);
                    parent[lastKey] = newValue;
                }
            } else {
                applyUpdate(currentData, path, value);
            }
        });

        this.writes.set(docRef.path, currentData);
        return this;
    }

    commit(): void {
        // Check for conflicts
        for (const [path, version] of this.readVersions.entries()) {
            if (this.firestore.getVersion(path) !== version) {
                throw new FirestoreError("aborted", "Transaction conflict detected");
            }
        }
        // Apply writes
        for (const [path, data] of this.writes.entries()) {
            this.firestore.data.set(path, data);
            this.firestore.incrementVersion(path);
        }
    }

    create(docRef: MockDocumentReference, data: any): this {
        if (this.firestore.getDataAtPath(docRef.path)) {
            throw new FirestoreError("already-exists", "Document already exists");
        }
        this.writes.set(docRef.path, data);
        return this;
    }

    delete(docRef: MockDocumentReference): this {
        this.writes.set(docRef.path, undefined);
        return this;
    }
}

export class MockDocumentSnapshot implements DocumentSnapshot {
    createTime?: Timestamp;
    updateTime?: Timestamp;
    readTime = Timestamp.now();

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

    get(fieldPath: FieldPath | string): any {
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

    isEqual(other: MockDocumentSnapshot): boolean {
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
    docs: MockQueryDocumentSnapshot[];

    constructor(docs: MockQueryDocumentSnapshot[]) {
        this.docs = docs;
    }

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

type MockFieldValueOptions =
    | "arrayRemove"
    | "arrayUnion"
    | "delete"
    | "increment"
    | "serverTimestamp";
export class MockFieldValue implements FieldValue {
    readonly operation: MockFieldValueOptions;
    private readonly elements: any[];

    private constructor(operation: MockFieldValueOptions, elements: any[]) {
        this.operation = operation;
        this.elements = elements;
    }

    static delete(): MockFieldValue {
        return new MockFieldValue("delete", []);
    }

    static serverTimestamp(): MockFieldValue {
        return new MockFieldValue("serverTimestamp", []);
    }

    static increment(n: number): MockFieldValue {
        return new MockFieldValue("increment", [n]);
    }

    static arrayUnion(...elements: any[]): MockFieldValue {
        return new MockFieldValue("arrayUnion", elements);
    }

    static arrayRemove(...elements: any[]): MockFieldValue {
        return new MockFieldValue("arrayRemove", elements);
    }

    applyTo(currentValue: any): any {
        if (this.operation === "delete") {
            return undefined;
        }
        if (this.operation === "serverTimestamp") {
            return Timestamp.now();
        }
        if (this.operation === "increment") {
            return (currentValue ?? 0) + this.elements[0];
        }
        if (this.operation === "arrayUnion") {
            const set = new Set(currentValue ?? []);
            this.elements.forEach((element) => set.add(element));
            return Array.from(set);
        }
        if (this.operation === "arrayRemove") {
            return (currentValue ?? []).filter((item: any) => !this.elements.includes(item));
        }
    }

    isEqual(other: FieldValue): boolean {
        console.log("MockFieldValue.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }
}

export class MockFieldPath implements FieldPath {
    private readonly fieldPath: string;
    private constructor(fieldPath: string) {
        this.fieldPath = fieldPath;
    }

    static documentId(): MockFieldPath {
        // A special identifier for document ID
        return new MockFieldPath("__name__");
    }

    static fromSegments(...segments: string[]): MockFieldPath {
        return new MockFieldPath(segments.join("."));
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
    private readonly queryConstraints: any[] = [];
    private docs: MockQueryDocumentSnapshot[] = [];
    private orderByField: string | null = null;
    readonly #initPromise: Promise<void>;

    constructor(
        private readonly collection: MockCollection | null,
        private readonly firestore: MockFirestore,
        private readonly collectionGroupId?: string,
    ) {
        this.#initPromise = this.init();
    }

    async init(): Promise<void> {
        if (this.collectionGroupId) {
            // For collectionGroup queries
            this.docs = this.#getCollectionGroupDocs();
        } else if (this.collection) {
            // For collection queries
            const docsPromise = Array.from(this.firestore.data.entries())
                .filter(([docPath]) => docPath.startsWith(this.collection.path))
                .map(([docPath]) => new MockDocumentReference(docPath, this.firestore))
                .map((docRef) => docRef.get());
            const docsSnaps = await Promise.all(docsPromise);
            this.docs = docsSnaps.map((snap) => {
                return new MockQueryDocumentSnapshot(snap.ref, snap.exists, snap.data());
            });
        } else {
            throw new Error("Invalid query: Must have either a collection or collectionGroupId.");
        }
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

    select(...field: (MockFieldPath | string)[]): any {
        console.log("MockQuery.select", field);
        throw new NotImplementedError("select is not implemented");
    }

    offset(offset: number): any {
        console.log("MockQuery.offset", offset);
        throw new NotImplementedError("offset is not implemented");
    }

    explain(options?: any): any {
        console.log("MockQuery.explain", options);
        throw new NotImplementedError("explain is not implemented");
    }

    limitToLast(limit: number): this {
        this.queryConstraints.push({ type: "limitToLast", value: limit });
        return this;
    }

    orderBy(fieldPath: MockFieldPath | string, directionStr: OrderByDirection = "asc"): this {
        const fieldPathStr = typeof fieldPath === "string" ? fieldPath : fieldPath.toString();
        this.queryConstraints.push({
            type: "orderBy",
            fieldPath: fieldPathStr,
            direction: directionStr,
        });
        this.orderByField = fieldPathStr;
        return this;
    }

    startAt(...args: any[]): this {
        this.queryConstraints.push({
            type: "startAt",
            values: args,
            fieldPath: this.orderByField,
        });
        return this;
    }

    startAfter(...args: any[]): this {
        this.queryConstraints.push({
            type: "startAfter",
            values: args,
            fieldPath: this.orderByField,
        });
        return this;
    }

    endAt(...args: any[]): this {
        this.queryConstraints.push({
            type: "endAt",
            values: args,
            fieldPath: this.orderByField,
        });
        return this;
    }

    endBefore(...args: any[]): this {
        this.queryConstraints.push({
            type: "endBefore",
            values: args,
            fieldPath: this.orderByField,
        });
        return this;
    }

    where(
        filterOrFieldPath: MockFieldPath | any | string,
        opStr?: WhereFilterOp,
        value?: any,
    ): this {
        if (!opStr && !value) {
            throw new NotImplementedError("where for filter is not implemented");
        }
        const computedFilterOrFieldPath =
            filterOrFieldPath instanceof MockFieldPath
                ? filterOrFieldPath.toString()
                : filterOrFieldPath;
        this.queryConstraints.push({
            type: "where",
            fieldPath: computedFilterOrFieldPath,
            opStr,
            value,
        });
        return this;
    }

    limit(n: number): this {
        this.queryConstraints.push({ type: "limit", value: n });
        return this;
    }

    isEqual(other: any): boolean {
        console.log("MockQuery.isEqual", other);
        throw new NotImplementedError("isEqual is not implemented");
    }

    async get(): Promise<MockQuerySnapshot> {
        await this.#initPromise;

        if (this.collectionGroupId) {
            return new MockQuerySnapshot(this.#getCollectionGroupDocs());
        }

        let filteredDocs = this.docs;

        for (const constraint of this.queryConstraints) {
            if (constraint.type === "orderBy") {
                filteredDocs.sort((a, b) => {
                    const aValue = a.get(constraint.fieldPath);
                    const bValue = b.get(constraint.fieldPath);
                    if (constraint.direction === "asc") {
                        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                    }
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                });
            }
            if (constraint.type === "where") {
                filteredDocs = filteredDocs.filter((docRef) => {
                    // Special handling for document ID
                    if (constraint.fieldPath === "__name__") {
                        return constraint.opStr === "in" && constraint.value.includes(docRef.id);
                    }
                    const docValue = getNestedValue(docRef.data(), constraint.fieldPath);

                    switch (constraint.opStr) {
                        case "==":
                            return docValue === constraint.value;
                        case "!=":
                            return docValue !== constraint.value;
                        case "<":
                            return docValue < constraint.value;
                        case "<=":
                            return docValue <= constraint.value;
                        case ">":
                            return docValue > constraint.value;
                        case ">=":
                            return docValue >= constraint.value;
                        case "array-contains":
                            return Array.isArray(docValue) && docValue.includes(constraint.value);
                        case "array-contains-any":
                            return (
                                Array.isArray(docValue) &&
                                constraint.value.some((value) => docValue.includes(value))
                            );
                        case "in":
                            return (
                                Array.isArray(constraint.value) &&
                                constraint.value.includes(docValue)
                            );
                        case "not-in":
                            return (
                                Array.isArray(constraint.value) &&
                                !constraint.value.includes(docValue)
                            );
                        default:
                            throw new Error(`Unsupported operator: ${constraint.opStr}`);
                    }
                });
            }
            if (constraint.type === "startAt") {
                const position = constraint.values[0];
                filteredDocs = filteredDocs.filter(
                    (doc) => doc.get(constraint.fieldPath) >= position,
                );
            }
            if (constraint.type === "endAt") {
                const position = constraint.values[0];
                filteredDocs = filteredDocs.filter(
                    (doc) => doc.get(constraint.fieldPath) <= position,
                );
            }
            if (constraint.type === "startAfter") {
                const position = constraint.values[0];
                filteredDocs = filteredDocs.filter(
                    (doc) => doc.get(constraint.fieldPath) > position,
                );
            }
            if (constraint.type === "endBefore") {
                const position = constraint.values[0];
                filteredDocs = filteredDocs.filter(
                    (doc) => doc.get(constraint.fieldPath) < position,
                );
            }
            if (constraint.type === "limit") {
                filteredDocs = filteredDocs.slice(0, constraint.value);
            }
            if (constraint.type === "limitToLast") {
                filteredDocs = filteredDocs.slice(-constraint.value);
            }
            if (constraint.type === "limitToLast") {
                filteredDocs = filteredDocs.slice(-constraint.value);
            }
        }

        return new MockQuerySnapshot(filteredDocs);
    }

    #getCollectionGroupDocs(): MockQueryDocumentSnapshot[] {
        const docs = [];
        if (!this.collectionGroupId) {
            return docs;
        }
        for (const [path, data] of this.firestore.data.entries()) {
            const pathSegments = path.split("/");
            if (pathSegments.includes(this.collectionGroupId)) {
                const docRef = new MockDocumentReference(path, this.firestore);
                docs.push(new MockQueryDocumentSnapshot(docRef, true, data));
            }
        }
        return docs;
    }
}

export class MockWriteBatch {
    private readonly operations: {
        type: FirestoreOperation;
        docRef: MockDocumentReference;
        data?: any;
    }[] = [];

    set(docRef: MockDocumentReference, data: unknown): this {
        this.operations.push({ type: FirestoreOperation.SET, docRef, data });
        return this;
    }

    update(docRef: MockDocumentReference, data: unknown): this {
        this.operations.push({ type: FirestoreOperation.UPDATE, docRef, data });
        return this;
    }

    delete(docRef: MockDocumentReference): this {
        this.operations.push({ type: FirestoreOperation.DELETE, docRef });
        return this;
    }

    async commit(): Promise<MockWriteResult[]> {
        // First, validate all operations without applying them
        for (const operation of this.operations) {
            if (operation.type === FirestoreOperation.SET) {
                // No validation needed for set operations
                continue;
            } else if (operation.type === FirestoreOperation.UPDATE) {
                // Check if document exists
                const docSnapshot = await operation.docRef.get();
                if (!docSnapshot.exists) {
                    throw new FirestoreError(
                        "not-found",
                        `No document to update: Document at path '${operation.docRef.path}' does not exist.`,
                    );
                }
            } else if (operation.type === FirestoreOperation.DELETE) {
                // No validation needed for delete operations
                continue;
            } else {
                throw new Error(`Unsupported operation: ${operation.type}`);
            }
        }

        // If validation passes, perform all operations
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

class FirestoreError extends Error {
    constructor(
        public code: string,
        message: string,
    ) {
        super(message);
        this.name = "FirestoreError";
    }
}

class NotImplementedError extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
    }
}

function getNestedValue(data: any, fieldPath: string): any {
    const fields = fieldPath.split(".");
    let current = data;
    for (const field of fields) {
        if (current == null) return undefined;
        current = current[field];
    }
    return current;
}

function deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        target[key] =
            isObject(sourceValue) && isObject(targetValue)
                ? deepMerge(targetValue, sourceValue)
                : sourceValue;
    }
    return target;
}

function isObject(obj: any): obj is object {
    return obj && typeof obj === "object" && !Array.isArray(obj);
}
