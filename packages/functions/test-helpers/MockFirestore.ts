import type {
    CollectionReference,
    DocumentReference,
    DocumentSnapshot,
    FieldPath,
    FieldValue,
    Firestore,
    FirestoreDataConverter,
    OrderByDirection,
    Query,
    ReadOptions,
    Settings,
    WhereFilterOp,
} from "firebase-admin/firestore";
import { FirestoreOperation } from "./types.js";
import { generateRandomId } from "./utils.js";
import { Timestamp } from "firebase-admin/firestore";

type FirestoreData = Map<string, MockDocumentData>;

const validOperators: WhereFilterOp[] = [
    "<",
    "<=",
    "==",
    "!=",
    ">",
    ">=",
    "array-contains",
    "in",
    "not-in",
    "array-contains-any",
];

export class MockFirestore implements Firestore {
    simulateNetworkError = false;
    simulateTimeoutError = false;
    data: FirestoreData = new Map();
    private settingsValue: Settings;
    private readonly versions: Map<string, number> = new Map();
    private readonly queryListeners: Set<MockQuery> = new Set();

    constructor(settings: Settings = {}) {
        this.settingsValue = settings;
    }

    get databaseId(): string {
        throw new NotImplementedError("databaseId is not implemented");
    }

    listCollections(): Promise<MockCollection[]> {
        throw new NotImplementedError("listCollections is not implemented");
    }

    enableNetworkErrorSimulation(): void {
        this.simulateNetworkError = true;
    }

    disableNetworkErrorSimulation(): void {
        this.simulateNetworkError = false;
    }

    enableTimeoutErrorSimulation(): void {
        this.simulateTimeoutError = true;
    }

    disableTimeoutErrorSimulation(): void {
        this.simulateTimeoutError = false;
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
        this.settingsValue = settings;
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

    bulkWriter(): MockBulkWriter {
        return new MockBulkWriter(this);
    }

    bundle(name?: string): MockBundleBuilder {
        return new MockBundleBuilder(name ?? "");
    }

    batch(): MockWriteBatch {
        return new MockWriteBatch();
    }

    collectionGroup(collectionId: string): MockQuery {
        return new MockQuery("", this, collectionId);
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
        transactionOptions?: { maxAttempts?: number },
    ): Promise<T> {
        const maxAttempts = transactionOptions?.maxAttempts ?? 5;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const transaction = new MockTransaction(this);
            try {
                const result = await updateFunction(transaction);
                await transaction.commit();
                return result;
            } catch (error: any) {
                if (error.code === "aborted") {
                    attempts += 1;
                    if (attempts === maxAttempts) {
                        throw new FirestoreError(
                            "aborted",
                            "Transaction failed after maximum retries.",
                        );
                    }
                    // Optionally, add a delay before retrying
                } else {
                    throw error;
                }
            }
        }
        throw new FirestoreError("unknown", "Transaction failed for unknown reasons.");
    }

    // Method to get data at a specific path
    getDataAtPath(path: string): MockDocumentData | undefined {
        return this.data.get(path);
    }

    registerQueryListener(query: MockQuery): void {
        this.queryListeners.add(query);
    }

    unregisterQueryListener(query: MockQuery): void {
        this.queryListeners.delete(query);
    }

    async notifyQueryListeners(): Promise<void> {
        for (const query of this.queryListeners) {
            await query.notifyListeners();
        }
    }
}

class MockQuery implements Query {
    docs: MockQueryDocumentSnapshot[] = [];
    protected path: string;
    protected firestore: MockFirestore;
    protected converter: FirestoreDataConverter<any> | null;
    private readonly collectionGroupId: string | undefined;
    private queryConstraints: any[] = [];
    private readonly orderByField: string | null = null;
    private listeners: Array<(snapshot: MockQuerySnapshot) => void> = [];
    private lastSnapshot: MockQuerySnapshot | null = null;
    private offsetValue = 0;
    private orderByFields: { fieldPath: string; direction: OrderByDirection }[] = [];
    private selectedFields: string[] | null = null;

    constructor(
        path: string,
        firestore: MockFirestore,
        collectionGroupId?: string,
        converter: FirestoreDataConverter<any> | null = null,
    ) {
        this.path = path;
        this.firestore = firestore;
        this.collectionGroupId = collectionGroupId;
        this.converter = converter;
        this.init();
    }

    explainStream() {
        throw new NotImplementedError("explainStream is not implemented");
    }

    getPartitions() {
        throw new NotImplementedError("getPartitions is not implemented");
    }

    findNearest() {
        throw new NotImplementedError("findNearest is not implemented");
    }

    withConverter<U>(converter: FirestoreDataConverter<U>): MockQuery {
        return new MockQuery(this.path, this.firestore, this.collectionGroupId, converter);
    }

    init(): void {
        if (this.collectionGroupId) {
            // For collectionGroup queries
            this.docs = this.#getCollectionGroupDocs();
        } else if (this.path) {
            // For collection queries
            const expectedDepth = this.path.split("/").length + 1;
            this.docs = Array.from(this.firestore.data.entries())
                .filter(
                    ([docPath]) =>
                        docPath.startsWith(this.path) &&
                        docPath.split("/").length === expectedDepth,
                )
                .map(([docPath, documentData]) => {
                    const ref = new MockDocumentReference(docPath, this.firestore);
                    return new MockQueryDocumentSnapshot(
                        ref,
                        true,
                        documentData.data,
                        documentData.createTime,
                        documentData.updateTime,
                    );
                });
        } else {
            throw new Error("Invalid query: Must have either a path or collectionGroupId.");
        }
    }

    async notifyListeners(): Promise<void> {
        const previousDocs = this.lastSnapshot?.docs ?? null;
        const snapshot = await this.getWithPreviousDocs(previousDocs);
        for (const listener of this.listeners) {
            listener(snapshot);
        }
        // Update lastSnapshot afterward
        this.lastSnapshot = snapshot;
    }

    get(): Promise<MockQuerySnapshot> {
        return this.getWithPreviousDocs(null);
    }

    onSnapshot(
        onNext: (snapshot: MockQuerySnapshot) => void,
        onError?: (error: Error) => void,
    ): () => void {
        this.listeners.push(onNext);
        this.firestore.registerQueryListener(this);

        // Immediately call the listener with the current snapshot
        (async () => {
            try {
                const snapshot = await this.get();
                // Notify listener first
                onNext(snapshot);
                // Then update lastSnapshot
                this.lastSnapshot = snapshot;
            } catch (error) {
                if (onError) {
                    onError(error);
                }
            }
        })();

        // Return an unsubscribe function
        return () => {
            this.listeners = this.listeners.filter((listener) => listener !== onNext);
            if (this.listeners.length === 0) {
                this.firestore.unregisterQueryListener(this);
            }
        };
    }

    async *stream(): AsyncIterable<MockQueryDocumentSnapshot> {
        const snapshot = await this.get();
        for (const doc of snapshot.docs) {
            yield doc;
        }
    }

    count(): Promise<{ count: number }> {
        return this.get().then((snapshot) => ({ count: snapshot.size }));
    }

    async aggregate(
        aggregations: {
            [key: string]: "avg" | "count" | "sum";
            field?: string;
        }[],
    ): Promise<{ [key: string]: number }> {
        const results: { [key: string]: number } = {};
        const snapshot = await this.get();
        const docs = snapshot.docs;
        for (const aggregation of aggregations) {
            const { key, type, field } = aggregation;
            if (type === "count") {
                results[key] = docs.length;
            } else if (type === "sum" && field) {
                results[key] = docs.reduce(function (acc, doc) {
                    return acc + (doc.get(field) || 0);
                }, 0);
            } else if (type === "avg" && field) {
                const sum = docs.reduce(function (acc, doc) {
                    return acc + (doc.get(field) || 0);
                }, 0);
                results[key] = sum / docs.length;
            } else {
                throw new FirestoreError(
                    "invalid-argument",
                    `Unsupported aggregation type: ${type}`,
                );
            }
        }
        return results;
    }

    select(...fields: (MockFieldPath | string)[]): MockQuery {
        const newQuery = this.clone();
        newQuery.selectedFields = fields.map((field) =>
            typeof field === "string" ? field : field.toString(),
        );
        return newQuery;
    }

    offset(offset: number): MockQuery {
        if (offset < 0) {
            throw new FirestoreError("invalid-argument", "Offset must not be negative");
        }
        const newQuery = this.clone();
        newQuery.offsetValue = offset;
        return newQuery;
    }

    explain(): Promise<{ queryPlan: any }> {
        return Promise.resolve({
            queryPlan: {
                path: this.path,
                collectionGroupId: this.collectionGroupId,
                constraints: this.queryConstraints,
                orderBy: this.orderByFields,
            },
        });
    }

    limitToLast(limit: number): MockQuery {
        if (limit <= 0) {
            throw new FirestoreError("invalid-argument", "Limit must be positive");
        }
        const newQuery = this.clone();
        newQuery.queryConstraints.push({ type: "limitToLast", value: limit });
        return newQuery;
    }

    orderBy(fieldPath: MockFieldPath | string, directionStr: OrderByDirection = "asc"): MockQuery {
        const fieldPathStr = typeof fieldPath === "string" ? fieldPath : fieldPath.toString();
        const newQuery = this.clone();
        newQuery.orderByFields.push({ fieldPath: fieldPathStr, direction: directionStr });
        return newQuery;
    }

    startAt(...args: any[]): MockQuery {
        if (this.orderByFields.length === 0) {
            throw new FirestoreError(
                "invalid-argument",
                "You must specify at least one orderBy clause before calling startAt",
            );
        }
        if (args.length !== this.orderByFields.length) {
            throw new FirestoreError(
                "invalid-argument",
                "Number of arguments must match number of orderBy fields",
            );
        }
        const newQuery = this.clone();
        newQuery.queryConstraints.push({
            type: "startAt",
            values: args,
            fieldPaths: this.orderByFields.map((field) => field.fieldPath),
        });
        return newQuery;
    }

    startAfter(...args: any[]): MockQuery {
        if (this.orderByFields.length === 0) {
            throw new FirestoreError(
                "invalid-argument",
                "You must specify at least one orderBy clause before calling startAfter",
            );
        }
        if (args.length !== this.orderByFields.length) {
            throw new FirestoreError(
                "invalid-argument",
                "Number of arguments must match number of orderBy fields",
            );
        }
        const newQuery = this.clone();
        newQuery.queryConstraints.push({
            type: "startAfter",
            values: args,
            fieldPaths: this.orderByFields.map((field) => field.fieldPath),
        });
        return newQuery;
    }

    endAt(...args: any[]): MockQuery {
        if (this.orderByFields.length === 0) {
            throw new FirestoreError(
                "invalid-argument",
                "You must specify at least one orderBy clause before calling endAt",
            );
        }
        if (args.length !== this.orderByFields.length) {
            throw new FirestoreError(
                "invalid-argument",
                "Number of arguments must match number of orderBy fields",
            );
        }
        const newQuery = this.clone();
        newQuery.queryConstraints.push({
            type: "endAt",
            values: args,
            fieldPaths: this.orderByFields.map((field) => field.fieldPath),
        });
        return newQuery;
    }

    endBefore(...args: any[]): MockQuery {
        if (this.orderByFields.length === 0) {
            throw new FirestoreError(
                "invalid-argument",
                "You must specify at least one orderBy clause before calling endBefore",
            );
        }
        if (args.length !== this.orderByFields.length) {
            throw new FirestoreError(
                "invalid-argument",
                "Number of arguments must match number of orderBy fields",
            );
        }
        const newQuery = this.clone();
        newQuery.queryConstraints.push({
            type: "endBefore",
            values: args,
            fieldPaths: this.orderByFields.map((field) => field.fieldPath),
        });
        return newQuery;
    }

    where(
        filterOrFieldPath: MockFieldPath | any | string,
        opStr?: WhereFilterOp,
        value?: any,
    ): MockQuery {
        if (!opStr && !value) {
            throw new NotImplementedError("where for filter is not implemented");
        }

        if (opStr && !validOperators.includes(opStr)) {
            throw new FirestoreError("invalid-argument", `Unsupported operator: ${opStr}`);
        }

        const computedFilterOrFieldPath =
            filterOrFieldPath instanceof MockFieldPath
                ? filterOrFieldPath.toString()
                : filterOrFieldPath;

        const newQuery = this.clone();
        newQuery.queryConstraints.push({
            type: "where",
            fieldPath: computedFilterOrFieldPath,
            opStr,
            value,
        });
        return newQuery;
    }

    limit(n: number): MockQuery {
        const newQuery = this.clone();
        newQuery.queryConstraints.push({ type: "limit", value: n });
        return newQuery;
    }

    isEqual(other: any): boolean {
        if (!(other instanceof MockQuery)) {
            return false;
        }

        // Compare paths
        if (this.path !== other.path) {
            return false;
        }

        // Compare collectionGroupId
        if (this.collectionGroupId !== other.collectionGroupId) {
            return false;
        }

        // Compare queryConstraints (order-insensitive)
        if (this.queryConstraints.length !== other.queryConstraints.length) {
            return false;
        }

        const constraintsA = [...this.queryConstraints].sort(compareConstraints);
        const constraintsB = [...other.queryConstraints].sort(compareConstraints);

        for (const [i, element] of constraintsA.entries()) {
            if (!deepEqual(element, constraintsB[i])) {
                return false;
            }
        }

        // Compare orderByFields (order matters)
        if (this.orderByFields.length !== other.orderByFields.length) {
            return false;
        }

        for (let i = 0; i < this.orderByFields.length; i++) {
            const orderA = this.orderByFields[i];
            const orderB = other.orderByFields[i];

            if (!deepEqual(orderA, orderB)) {
                return false;
            }
        }

        return true;
    }

    private getWithPreviousDocs(
        previousDocs: MockQueryDocumentSnapshot[] | null,
    ): Promise<MockQuerySnapshot> {
        let docs: MockQueryDocumentSnapshot[] = [];

        if (this.collectionGroupId) {
            docs = this.#getCollectionGroupDocs();
        } else if (this.path) {
            const expectedDepth = this.path.split("/").length + 1;
            const entries = Array.from(this.firestore.data.entries());
            docs = entries
                .filter(
                    ([docPath]) =>
                        docPath.startsWith(this.path) &&
                        docPath.split("/").length === expectedDepth,
                )
                .map(([docPath, documentData]) => {
                    const ref = new MockDocumentReference(docPath, this.firestore);
                    return new MockQueryDocumentSnapshot(
                        ref,
                        true,
                        documentData.data,
                        documentData.createTime,
                        documentData.updateTime,
                    );
                });
        } else {
            throw new Error("Invalid query: Must have either a path or collectionGroupId.");
        }

        let filteredDocs = docs;

        // 1. Apply where constraints
        for (const constraint of this.queryConstraints) {
            if (constraint.type === "where") {
                filteredDocs = filteredDocs.filter((docRef) => {
                    // Special handling for document ID
                    if (constraint.fieldPath === "__name__") {
                        return constraint.opStr === "in" && constraint.value.includes(docRef.id);
                    }
                    const data = docRef.data();

                    const docValue = getNestedValue(data, constraint.fieldPath);

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
                                constraint.value.some(function (value) {
                                    return docValue.includes(value);
                                })
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
        }

        // 2. Apply orderBy constraints
        if (this.orderByFields.length > 0) {
            filteredDocs.sort((a, b) => {
                for (const { fieldPath, direction } of this.orderByFields) {
                    const aValue = a.get(fieldPath);
                    const bValue = b.get(fieldPath);
                    if (aValue < bValue) {
                        return direction === "asc" ? -1 : 1;
                    } else if (aValue > bValue) {
                        return direction === "asc" ? 1 : -1;
                    }
                    // Values are equal, move to next field
                }
                return 0;
            });
        }

        // 3. Determine if limitToLast is used
        const hasLimitToLast = this.queryConstraints.some(
            (constraint) => constraint.type === "limitToLast",
        );

        if (hasLimitToLast) {
            // Invert the order for limitToLast
            filteredDocs.reverse();
        }

        // 4. Apply cursor constraints
        for (const constraint of this.queryConstraints) {
            if (constraint.type === "startAt") {
                const positions = constraint.values;
                const fieldPaths = constraint.fieldPaths;
                filteredDocs = filteredDocs.filter((doc) => {
                    return this.compareDocs(doc, positions, fieldPaths) >= 0;
                });
            }

            if (constraint.type === "endAt") {
                const positions = constraint.values;
                const fieldPaths = constraint.fieldPaths;
                filteredDocs = filteredDocs.filter((doc) => {
                    return this.compareDocs(doc, positions, fieldPaths) <= 0;
                });
            }

            if (constraint.type === "startAfter") {
                const positions = constraint.values;
                const fieldPaths = constraint.fieldPaths;
                filteredDocs = filteredDocs.filter((doc) => {
                    return this.compareDocs(doc, positions, fieldPaths) > 0;
                });
            }

            if (constraint.type === "endBefore") {
                const positions = constraint.values;
                const fieldPaths = constraint.fieldPaths;
                filteredDocs = filteredDocs.filter((doc) => {
                    return this.compareDocs(doc, positions, fieldPaths) < 0;
                });
            }
        }

        // 5. Apply offset
        if (this.offsetValue > 0) {
            filteredDocs = filteredDocs.slice(this.offsetValue);
        }

        // 6. Apply limit
        for (const constraint of this.queryConstraints) {
            if (constraint.type === "limit") {
                filteredDocs = filteredDocs.slice(0, constraint.value);
            }
            // Do not process limitToLast here
        }

        // 7. Apply limitToLast after other constraints
        for (const constraint of this.queryConstraints) {
            if (constraint.type === "limitToLast") {
                filteredDocs = filteredDocs.slice(0, constraint.value);
            }
        }

        // 8. Reverse back the documents if limitToLast was used
        if (hasLimitToLast) {
            filteredDocs.reverse();
        }

        // Apply selected fields
        if (this.selectedFields) {
            filteredDocs = filteredDocs.map((doc) => {
                const data = doc.data();
                const selectedData = {};
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked above
                for (const field of this.selectedFields!) {
                    const value = getNestedValue(data, field);
                    if (value !== undefined) {
                        setNestedValue(selectedData, field, value);
                    }
                }
                return new MockQueryDocumentSnapshot(
                    doc.ref,
                    doc.exists,
                    selectedData,
                    doc.createTime,
                    doc.updateTime,
                );
            });
        }

        return Promise.resolve(new MockQuerySnapshot(filteredDocs, previousDocs, this.converter));
    }

    private clone(): MockQuery {
        const newQuery = new MockQuery(
            this.path,
            this.firestore,
            this.collectionGroupId,
            this.converter,
        );
        newQuery.queryConstraints = [...this.queryConstraints];
        newQuery.orderByFields = [...this.orderByFields];
        newQuery.offsetValue = this.offsetValue;
        return newQuery;
    }

    private compareDocs(
        doc: MockQueryDocumentSnapshot,
        values: any[],
        fieldPaths: string[],
    ): number {
        for (const [i, fieldPath] of fieldPaths.entries()) {
            const direction = this.orderByFields[i].direction;
            const docValue = doc.get(fieldPath);
            const value = values[i];
            if (docValue < value) {
                return direction === "asc" ? -1 : 1;
            } else if (docValue > value) {
                return direction === "asc" ? 1 : -1;
            }
            // Values are equal, continue to next field
        }
        // All values are equal
        return 0;
    }

    #getCollectionGroupDocs(): MockQueryDocumentSnapshot[] {
        const docs: MockQueryDocumentSnapshot[] = [];
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

export class MockCollection extends MockQuery implements CollectionReference {
    override readonly path: string;
    override readonly firestore: MockFirestore;
    readonly id: string;
    parent: MockDocumentReference | null;

    private override readonly converter: FirestoreDataConverter<any> | null;

    constructor(
        path: string,
        firestore: MockFirestore,
        converter: FirestoreDataConverter<any> | null = null,
    ) {
        super(path, firestore, undefined, converter);
        this.path = path;
        this.firestore = firestore;
        this.converter = converter;
    }

    findNearest() {
        throw new NotImplementedError("findNearest is not implemented");
    }

    override explainStream(options?: FirebaseFirestore.ExplainOptions): NodeJS.ReadableStream {
        throw new NotImplementedError("explainStream is not implemented");
    }

    override withConverter<U>(converter: FirestoreDataConverter<U>): MockCollection {
        return new MockCollection(this.path, this.firestore, converter);
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

    doc(docId?: string): MockDocumentReference {
        const id = docId ?? generateRandomId();
        const docPath = `${this.path}/${id}`;
        return new MockDocumentReference(docPath, this.firestore, this.converter);
    }

    async add(data: any): Promise<MockDocumentReference> {
        const docRef = this.doc();
        await docRef.set(data);
        return docRef;
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
    public parent: MockCollection;
    private listeners: Array<(snapshot: MockDocumentSnapshot) => void> = [];

    private readonly converter: FirestoreDataConverter<any> | null;

    constructor(
        path: string,
        firestore: MockFirestore,
        converter: FirestoreDataConverter<any> | null = null,
    ) {
        this.path = path;
        this.firestore = firestore;
        this.id = path.split("/").pop() ?? "";
        this.converter = converter;
    }

    withConverter<U>(converter: FirestoreDataConverter<U>): MockDocumentReference {
        return new MockDocumentReference(this.path, this.firestore, converter);
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

    async create(data: any): Promise<MockWriteResult> {
        if (this.firestore.data.has(this.path)) {
            throw new FirestoreError("already-exists", "Document already exists");
        }
        if (data === undefined || data === null) {
            throw new FirestoreError(
                "invalid-argument",
                "Data to create cannot be undefined or null",
            );
        }

        // Use converter if available
        const dataToStore = this.converter ? this.converter.toFirestore(data) : data;

        const newDocumentData = new MockDocumentData(dataToStore);
        this.firestore.data.set(this.path, newDocumentData);

        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        await this.firestore.notifyQueryListeners();
        return new MockWriteResult();
    }

    async set(
        data: any,
        options?: { merge?: boolean; mergeFields?: (MockFieldPath | string)[] },
    ): Promise<MockWriteResult> {
        if (data === undefined || data === null) {
            throw new FirestoreError("invalid-argument", "Data to set cannot be undefined or null");
        }

        if (options?.merge && options?.mergeFields) {
            throw new FirestoreError(
                "invalid-argument",
                "Cannot specify both 'merge' and 'mergeFields' options.",
            );
        }

        // Use converter if available
        const dataToStore = this.converter ? this.converter.toFirestore(data) : data;

        const existingDocumentData = this.firestore.data.get(this.path);

        if (options?.mergeFields) {
            const mergedData = existingDocumentData ? { ...existingDocumentData.data } : {};
            for (const field of options.mergeFields) {
                const fieldPath = field instanceof MockFieldPath ? field.toString() : field;
                const value = getNestedValue(dataToStore, fieldPath);
                if (value !== undefined) {
                    setNestedValue(mergedData, fieldPath, value);
                }
            }
            if (existingDocumentData) {
                existingDocumentData.updateData(mergedData);
            } else {
                const newDocumentData = new MockDocumentData(mergedData);
                this.firestore.data.set(this.path, newDocumentData);
            }
        } else if (options?.merge && existingDocumentData) {
            const existingData = existingDocumentData.data;
            const mergedData = deepMerge(existingData, dataToStore);
            existingDocumentData.updateData(mergedData);
        } else {
            const newDocumentData = new MockDocumentData(dataToStore);
            this.firestore.data.set(this.path, newDocumentData);
        }

        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        await this.firestore.notifyQueryListeners();
        return new MockWriteResult();
    }

    get(): Promise<MockDocumentSnapshot> {
        if (this.firestore.simulateNetworkError) {
            return Promise.reject(new FirestoreError("unavailable", "Simulated network error"));
        }

        if (this.firestore.simulateTimeoutError) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new FirestoreError("deadline-exceeded", "Simulated timeout error"));
                }, 1000);
            });
        }

        const documentData = this.firestore.data.get(this.path);
        const data = documentData ? customClone(documentData.data) : undefined;
        const convertedData = this.converter ? this.converter.fromFirestore(data) : data;
        const createTime = documentData?.createTime;
        const updateTime = documentData?.updateTime;
        const exists = convertedData !== undefined;
        return Promise.resolve(
            new MockDocumentSnapshot(this, exists, convertedData, createTime, updateTime),
        );
    }

    collection(subPath: string): MockCollection {
        const fullPath = `${this.path}/${subPath}`;
        return new MockCollection(fullPath, this.firestore);
    }

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockDocumentReference)) {
            return false;
        }

        return this.path === other.path;
    }

    async update(data: any): Promise<MockWriteResult> {
        const documentData = this.firestore.data.get(this.path);

        if (!documentData) {
            throw new FirestoreError(
                "not-found",
                `No document to update: Document at path '${this.path}' does not exist.`,
            );
        }

        // Create a deep copy of the current data to avoid in-place mutations
        const currentData = customClone(documentData.data);

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
                    parent[lastKey] = value.applyTo(currentValue);
                }
            } else {
                applyUpdate(currentData, path, value);
            }
        });

        // Update the document data with the new data object
        documentData.updateData(currentData);
        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        await this.firestore.notifyQueryListeners();
        return new MockWriteResult();
    }

    async delete(): Promise<MockWriteResult> {
        this.firestore.data.delete(this.path);
        this.firestore.incrementVersion(this.path);
        await this.notifyListeners();
        await this.firestore.notifyQueryListeners();
        return new MockWriteResult();
    }

    private async notifyListeners(): Promise<void> {
        const snapshot = await this.get();
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
}

export class MockTransaction {
    private readonly readVersions: Map<string, number> = new Map();
    private readonly writes: Map<string, { type: string; data?: any }> = new Map();
    private readonly firestore: MockFirestore;

    constructor(firestore: MockFirestore) {
        this.firestore = firestore;
    }

    get(docRef: MockDocumentReference): Promise<MockDocumentSnapshot> {
        // Record the version of the document being read
        const version = this.firestore.getVersion(docRef.path);
        this.readVersions.set(docRef.path, version);

        const writeOperation = this.writes.get(docRef.path);
        let data: any;
        let createTime: Timestamp | undefined;
        let updateTime: Timestamp | undefined;

        if (writeOperation) {
            if (writeOperation.type === "delete") {
                data = undefined;
            } else {
                data = writeOperation.data;
                // For simplicity, use current timestamp
                createTime = Timestamp.now();
                updateTime = Timestamp.now();
            }
        } else {
            const documentData = this.firestore.getDataAtPath(docRef.path);
            data = documentData?.data;
            createTime = documentData?.createTime;
            updateTime = documentData?.updateTime;
        }

        const exists = data !== undefined;
        return Promise.resolve(
            new MockDocumentSnapshot(docRef, exists, data, createTime, updateTime),
        );
    }

    set(docRef: MockDocumentReference, data: any): this {
        this.writes.set(docRef.path, { type: "set", data });
        return this;
    }

    update(docRef: MockDocumentReference, data: any): this {
        this.writes.set(docRef.path, { type: "update", data });
        return this;
    }

    delete(docRef: MockDocumentReference): this {
        this.writes.set(docRef.path, { type: "delete" });
        return this;
    }

    create(docRef: MockDocumentReference, data: any): this {
        this.writes.set(docRef.path, { type: "create", data });
        return this;
    }

    // eslint-disable-next-line require-await -- to match real firestore interface
    async commit(): Promise<void> {
        // Check for conflicts
        for (const [path, version] of this.readVersions.entries()) {
            if (this.firestore.getVersion(path) !== version) {
                throw new FirestoreError("aborted", "Transaction conflict detected");
            }
        }

        // Apply writes
        for (const [path, operation] of this.writes.entries()) {
            const existingDocumentData = this.firestore.data.get(path);
            switch (operation.type) {
                case "set":
                    if (existingDocumentData) {
                        // Overwrite existing document but keep createTime
                        existingDocumentData.updateData(operation.data);
                    } else {
                        // Create new document
                        const newDocumentData = new MockDocumentData(operation.data);
                        this.firestore.data.set(path, newDocumentData);
                    }
                    break;

                case "update":
                    if (!existingDocumentData) {
                        throw new FirestoreError(
                            "not-found",
                            `No document to update: Document at path '${path}' does not exist.`,
                        );
                    }
                    // eslint-disable-next-line no-case-declarations -- keep like this for now
                    const currentData = existingDocumentData.data;

                    // Apply updates
                    Object.keys(operation.data).forEach((key) => {
                        const value = operation.data[key];
                        const pathSegments = key.split(".");

                        if (value instanceof MockFieldValue) {
                            let parent = currentData;
                            for (let i = 0; i < pathSegments.length - 1; i++) {
                                parent = parent[pathSegments[i]] = parent[pathSegments[i]] ?? {};
                            }
                            const lastKey = pathSegments[pathSegments.length - 1];

                            if (value.operation === "delete") {
                                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keep like this for now
                                delete parent[lastKey];
                            } else {
                                const currentValue = parent[lastKey];
                                parent[lastKey] = value.applyTo(currentValue);
                            }
                        } else {
                            applyUpdate(currentData, pathSegments, value);
                        }
                    });

                    existingDocumentData.updateData(currentData);
                    break;

                case "delete":
                    this.firestore.data.delete(path);
                    break;

                case "create":
                    if (existingDocumentData) {
                        throw new FirestoreError("already-exists", "Document already exists");
                    }
                    // eslint-disable-next-line no-case-declarations -- keep like this for now
                    const newDocData = new MockDocumentData(operation.data);
                    this.firestore.data.set(path, newDocData);
                    break;

                default:
                    throw new Error(`Unsupported operation type: ${operation.type}`);
            }

            this.firestore.incrementVersion(path);
        }
    }
}

export class MockDocumentSnapshot implements DocumentSnapshot {
    createTime: Timestamp | undefined;
    updateTime: Timestamp | undefined;
    readTime = Timestamp.now();

    readonly #data: any;

    constructor(
        public readonly ref: any,
        public readonly exists: boolean,
        data: any,
        createTime?: Timestamp,
        updateTime?: Timestamp,
    ) {
        this.#data = data;
        this.createTime = createTime;
        this.updateTime = updateTime;
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

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockDocumentSnapshot)) {
            return false;
        }

        return (
            this.ref.isEqual(other.ref) &&
            this.exists === other.exists &&
            deepEqual(this.data(), other.data()) &&
            this.updateTime?.isEqual(other.updateTime) &&
            this.createTime?.isEqual(other.createTime)
        );
    }
}

export class MockQueryDocumentSnapshot extends MockDocumentSnapshot {
    data(): any | undefined {
        const data = super.data();
        return this.ref.converter ? this.ref.converter.fromFirestore(data) : data;
    }
}

type DocumentChange = {
    type: "added" | "modified" | "removed";
    doc: MockQueryDocumentSnapshot;
    oldIndex: number;
    newIndex: number;
};

class MockQuerySnapshot {
    size: number;
    query: any;
    empty: boolean;
    readTime = Timestamp.now();
    docs: MockQueryDocumentSnapshot[];

    private readonly previousDocs: MockQueryDocumentSnapshot[] | null;

    constructor(
        docs: MockQueryDocumentSnapshot[],
        previousDocs: MockQueryDocumentSnapshot[] | null = null,
        private readonly converter: FirestoreDataConverter<any> | null = null,
    ) {
        this.docs = docs;
        this.size = docs.length;
        this.empty = docs.length === 0;
        this.previousDocs = previousDocs;
    }

    docChanges(): DocumentChange[] {
        if (!this.previousDocs) {
            // If there's no previous snapshot, all docs are 'added'
            return this.docs.map((doc, index) => ({
                type: "added",
                doc,
                oldIndex: -1,
                newIndex: index,
            }));
        }

        const changes: DocumentChange[] = [];

        const oldDocsMap = new Map(this.previousDocs.map((doc, index) => [doc.id, { doc, index }]));
        const newDocsMap = new Map(this.docs.map((doc, index) => [doc.id, { doc, index }]));

        // Check for added and modified docs
        for (const [id, { doc, index }] of newDocsMap.entries()) {
            if (oldDocsMap.has(id)) {
                const oldDoc = oldDocsMap.get(id);
                if (!doc.updateTime?.isEqual(oldDoc.doc.updateTime)) {
                    changes.push({
                        type: "modified",
                        doc,
                        oldIndex: oldDoc.index,
                        newIndex: index,
                    });
                }
            } else {
                changes.push({ type: "added", doc, oldIndex: -1, newIndex: index });
            }
        }

        // Check for removed docs
        for (const [id, { doc, index }] of oldDocsMap.entries()) {
            if (!newDocsMap.has(id)) {
                changes.push({ type: "removed", doc, oldIndex: index, newIndex: -1 });
            }
        }

        return changes;
    }

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockQuerySnapshot)) {
            return false;
        }

        if (this.size !== other.size) {
            return false;
        }

        for (let i = 0; i < this.docs.length; i++) {
            if (!this.docs[i].isEqual(other.docs[i])) {
                return false;
            }
        }

        return true;
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

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockFieldValue)) {
            return false;
        }

        return this.operation === other.operation && deepEqual(this.elements, other.elements);
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

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockFieldPath)) {
            return false;
        }

        return this.fieldPath === other.fieldPath;
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

    isEqual(other: unknown): boolean {
        if (!(other instanceof MockWriteResult)) {
            return false;
        }

        return this.writeTime.isEqual(other.writeTime);
    }
}

class MockDocumentData {
    data: any;
    createTime: Timestamp;
    updateTime: Timestamp;

    constructor(data: any) {
        this.data = data;
        const now = Timestamp.now();
        this.createTime = now;
        this.updateTime = now;
    }

    updateData(newData: any): void {
        // Create a deep copy of the new data
        this.data = customClone(newData);
        this.updateTime = Timestamp.now();
    }
}

type BulkWriterOperation = {
    type: FirestoreOperation;
    docRef: MockDocumentReference;
    data?: any;
    resolve: (result: MockWriteResult) => void;
    reject: (error: Error) => void;
};

class MockBulkWriter {
    private operations: BulkWriterOperation[] = [];
    private isClosed = false;
    private readonly firestore: MockFirestore;

    constructor(firestore: MockFirestore) {
        this.firestore = firestore;
    }

    set(docRef: MockDocumentReference, data: any): Promise<MockWriteResult> {
        return this.enqueueOperation(FirestoreOperation.SET, docRef, data);
    }

    update(docRef: MockDocumentReference, data: any): Promise<MockWriteResult> {
        return this.enqueueOperation(FirestoreOperation.UPDATE, docRef, data);
    }

    delete(docRef: MockDocumentReference): Promise<MockWriteResult> {
        return this.enqueueOperation(FirestoreOperation.DELETE, docRef);
    }

    create(docRef: MockDocumentReference, data: any): Promise<MockWriteResult> {
        return this.enqueueOperation(FirestoreOperation.CREATE, docRef, data);
    }

    async close(): Promise<void> {
        if (this.isClosed) {
            throw new FirestoreError("failed-precondition", "BulkWriter has already been closed.");
        }

        this.isClosed = true;

        // Simulate processing of operations
        for (const operation of this.operations) {
            try {
                switch (operation.type) {
                    case FirestoreOperation.SET:
                        await operation.docRef.set(operation.data);
                        break;
                    case FirestoreOperation.UPDATE:
                        await operation.docRef.update(operation.data);
                        break;
                    case FirestoreOperation.DELETE:
                        await operation.docRef.delete();
                        break;
                    case FirestoreOperation.CREATE:
                        await operation.docRef.create(operation.data);
                        break;
                    default:
                        throw new FirestoreError(
                            "invalid-argument",
                            `Unsupported operation type: ${operation.type}`,
                        );
                }
                operation.resolve(new MockWriteResult());
            } catch (error) {
                operation.reject(error);
            }
        }

        this.operations = [];
    }

    private enqueueOperation(
        type: FirestoreOperation,
        docRef: MockDocumentReference,
        data?: any,
    ): Promise<MockWriteResult> {
        if (this.isClosed) {
            return Promise.reject(
                new FirestoreError("failed-precondition", "BulkWriter has been closed."),
            );
        }

        return new Promise((resolve, reject) => {
            this.operations.push({ type, docRef, data, resolve, reject });
        });
    }
}

class MockBundleBuilder {
    private readonly name: string;
    private readonly elements: Array<{ type: string; payload: any }> = [];

    constructor(name: string) {
        this.name = name;
    }

    add(docSnapshotOrQuery: unknown): this {
        if (docSnapshotOrQuery instanceof MockDocumentSnapshot) {
            this.elements.push({
                type: "document",
                payload: docSnapshotOrQuery.data(),
            });
        } else if (docSnapshotOrQuery instanceof MockQuery) {
            // For simplicity, we'll get all documents in the query
            this.elements.push({
                type: "query",
                payload: docSnapshotOrQuery.docs.map((doc) => doc.data()),
            });
        } else {
            throw new FirestoreError("invalid-argument", "Invalid argument to add()");
        }
        return this;
    }

    build(): string {
        // Simulate building the bundle by returning a JSON string
        return JSON.stringify({
            name: this.name,
            elements: this.elements,
        });
    }
}

export class MockGeoPoint {
    constructor(
        public latitude: number,
        public longitude: number,
    ) {}

    isEqual(other: MockGeoPoint): boolean {
        return this.latitude === other.latitude && this.longitude === other.longitude;
    }
}

export class FirestoreError extends Error {
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

function deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function setNestedValue(obj: any, fieldPath: string, value: any): void {
    const fields = fieldPath.split(".");
    let current = obj;
    for (let i = 0; i < fields.length - 1; i++) {
        const field = fields[i];
        current[field] = current[field] || {};
        current = current[field];
    }
    current[fields[fields.length - 1]] = value;
}

function compareConstraints(a: any, b: any): number {
    if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
    }

    // For 'where' constraints
    if (a.type === "where") {
        const fieldComparison = a.fieldPath.localeCompare(b.fieldPath);
        if (fieldComparison !== 0) return fieldComparison;

        const opComparison = a.opStr.localeCompare(b.opStr);
        if (opComparison !== 0) return opComparison;

        return compareValues(a.value, b.value);
    }

    // For other constraint types, you can add specific comparison logic
    // For simplicity, you can stringify and compare
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

function compareValues(a: any, b: any): number {
    if (a === b) return 0;
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function customClone(value: any): any {
    if (value instanceof Timestamp) {
        return new Timestamp(value.seconds, value.nanoseconds);
    } else if (value instanceof MockGeoPoint) {
        return new MockGeoPoint(value.latitude, value.longitude);
    } else if (Array.isArray(value)) {
        return value.map(customClone);
    } else if (value !== null && typeof value === "object") {
        const result: any = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                result[key] = customClone(value[key]);
            }
        }
        return result;
    }
    return value;
}
