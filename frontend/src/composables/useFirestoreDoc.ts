import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import { OptionsDocument, OptionsDocGet, OptionsDocWatch } from "./types/Options";
import { ReturnDocGet, ReturnDocWatch } from "./types/Return";

import { optsAreGetDoc } from "./types/type-guards";
import { firestore } from "src/services/firebase/base";
import {
    DocumentReference,
    DocumentData,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc as FirestoreDeleteDoc,
    getDoc,
} from "@firebase/firestore";
import { NOOP } from "src/helpers/utils";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { calculatePath } from "src/composables/types/utils";

// Overload Watch Doc
export function useFirestoreDoc<T, M = T>(
    options: { type: "watch" } & OptionsDocument<T, M>
): ReturnDocWatch<T, M>;
// Overload Get Doc
export function useFirestoreDoc<T, M = T>(
    options: { type: "get" } & OptionsDocument<T, M>
): ReturnDocGet<T, M>;
export function useFirestoreDoc<T, M = T>(options: OptionsDocument<T, M>) {
    const data: Ref<T | undefined> = ref();
    const mutatedData: Ref<undefined | M> = ref();
    const initialLoading = options.initialLoading ?? true;
    const loading = ref<boolean>(initialLoading);
    const received = ref(false);
    const onFinished = options.onFinished ?? NOOP;
    const inComponent = options.inComponent ?? true;

    // Path replaced computation
    const pathReplaced = computed(() => {
        const { path, variables } = options;
        return calculatePath(path, variables);
    });

    const firestoreRef = computed(() => doc(firestore(), pathReplaced.value));

    function updateDoc(updates: Partial<T>) {
        return setDoc<DocumentData>(firestoreRef.value, updates, {
            merge: true,
        });
    }

    function deleteDoc() {
        return FirestoreDeleteDoc(firestoreRef.value);
    }

    function receiveDocData(receivedData: T | undefined) {
        const opts = options as OptionsDocGet<T, M> | OptionsDocWatch<T, M>;
        if (opts.mutate) {
            mutatedData.value = opts.mutate(receivedData);
        }

        if (opts.onReceive) {
            opts.onReceive(receivedData, mutatedData.value);
        }

        data.value = receivedData;
        received.value = true;
        loading.value = false;
        onFinished(receivedData);
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    function withError<T extends (...args: any[]) => any>(fn: T) {
        return function (...args: Parameters<T>): ReturnType<T> | undefined {
            try {
                return fn(...args);
            } catch (e) {
                options.onError?.(e);
            }
        };
    }

    const getDocData = withError(async () => {
        const firestoreRefVal = firestoreRef.value as unknown as DocumentReference;
        const fetchedDoc = await getDoc(firestoreRefVal);
        if (!fetchedDoc.exists) return;
        return receiveDocData(firestoreDocSerializer(fetchedDoc));
    });

    let watcher: null | (() => void) = null;
    const watchData = withError(function () {
        watcher = onSnapshot(firestoreRef.value, (receivedDoc) => {
            receiveDocData(receivedDoc.exists() ? firestoreDocSerializer(receivedDoc) : undefined);
        });
    });

    function stopWatchingData() {
        if (watcher !== null) {
            watcher();
        }
    }

    if (options.type === "watch" && inComponent) {
        onUnmounted(stopWatchingData);
    }

    function debounceDataGetter() {
        nextTick(() => {
            if (!firestoreRef.value) {
                return;
            }

            loading.value = true;
            if (optsAreGetDoc(options)) {
                getDocData()?.catch(showErrorMessage);
            } else {
                stopWatchingData();
                watchData();
            }
        }).catch(showErrorMessage);
    }

    watch(
        pathReplaced,
        (v) => {
            if (options.manual) {
                return;
            }
            if (v) {
                debounceDataGetter();
            } else {
                stop();
            }
        },
        { immediate: true }
    );

    function firestoreDocSerializer(docToSerialize: DocumentData): T {
        return {
            id: docToSerialize.id,
            ...docToSerialize.data(),
        };
    }

    const returnVal = {
        mutatedData,
        loading,
        received,
        pathReplaced,
        firestoreRef,
        updateDoc,
        deleteDoc,
    };

    if (optsAreGetDoc(options)) {
        return {
            ...returnVal,
            data,
            getData: getDocData,
        };
    }

    return {
        ...returnVal,
        data,
        watchData,
        stopWatchingData,
    };
}
