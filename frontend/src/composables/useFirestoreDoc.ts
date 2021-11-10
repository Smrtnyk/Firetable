import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import { OptionsDocument } from "./types/Options";
import { ReturnDocGet, ReturnDocWatch } from "./types/Return";
import { optsAreGetDoc } from "./types/type-guards";
import { firestore } from "src/services/firebase/base";
import {
    DocumentData,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc as FirestoreDeleteDoc,
    getDoc,
} from "@firebase/firestore";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { calculatePath, firestoreDocSerializer, withError } from "src/composables/types/utils";

export function useFirestoreDoc<T, M = T>(
    options: { type: "watch" } & OptionsDocument<T, M>
): ReturnDocWatch<T, M>;
export function useFirestoreDoc<T, M = T>(
    options: { type: "get" } & OptionsDocument<T, M>
): ReturnDocGet<T, M>;
export function useFirestoreDoc<T, M = T>(options: OptionsDocument<T, M>) {
    const data: Ref<T | undefined> = ref();
    const mutatedData: Ref<undefined | M> = ref();
    const initialLoading = options.initialLoading ?? true;
    const loading = ref<boolean>(initialLoading);
    const received = ref(false);
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
        mutatedData.value = options.mutate?.(receivedData);
        options.onReceive?.(receivedData, mutatedData.value);
        data.value = receivedData;
        received.value = true;
        loading.value = false;
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    const getDocData = withError(options.onError, async () => {
        const fetchedDoc = await getDoc(firestoreRef.value);
        if (!fetchedDoc.exists) return;
        return receiveDocData(firestoreDocSerializer(fetchedDoc));
    });

    let watcher: null | (() => void) = null;
    const watchData = withError(options.onError, function () {
        watcher = onSnapshot(firestoreRef.value, (receivedDoc) => {
            receiveDocData(receivedDoc.exists() ? firestoreDocSerializer(receivedDoc) : undefined);
        });
    });

    function stopWatchingData() {
        watcher?.();
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
        function (val) {
            if (options.manual) return;
            val ? debounceDataGetter() : stop();
        },
        { immediate: true }
    );

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
