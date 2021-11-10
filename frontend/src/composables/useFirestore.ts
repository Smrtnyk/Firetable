import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import { OptionsCollection, OptionsCollGet, OptionsCollWatch } from "./types/Options";
import { ReturnCollGet, ReturnCollWatch } from "./types/Return";

import { optsAreGetColl } from "./types/type-guards";
import { firestore } from "src/services/firebase/base";
import { CollectionRef } from "src/types/firebase";
import { DocumentData, onSnapshot, collection, getDocs } from "@firebase/firestore";
import { NOOP } from "src/helpers/utils";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { calculatePath } from "src/composables/types/utils";

export function useFirestore<T, M = T>(
    options: { type: "watch" } & OptionsCollection<T, M>
): ReturnCollWatch<T, M>;
// @ts-ignore -- figure out how to fix this
export function useFirestore<T, M = T>(
    options: { type: "get" } & OptionsCollection<T, M>
): ReturnCollGet<T, M>;
export function useFirestore<T, M = T>(options: OptionsCollection<T, M>) {
    const collectionData: Ref<T[]> = ref([]);
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

    const firestoreRef = computed(() => collection(firestore(), pathReplaced.value));

    const firestoreQuery = computed(() => {
        if (options.query !== undefined) {
            return options.query(firestoreRef.value);
        }
        return null;
    });

    function receiveCollData(receivedData: T[]) {
        const opts = options as OptionsCollWatch<T, M> | OptionsCollGet<T, M>;
        if (opts.mutate) {
            mutatedData.value = opts.mutate(receivedData);
        }

        if (opts.onReceive) {
            opts.onReceive(receivedData, mutatedData.value);
        }

        collectionData.value = receivedData;
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

    const getCollData = withError(async () => {
        const firestoreRefVal = firestoreQuery.value
            ? firestoreQuery.value
            : (firestoreRef.value as unknown as CollectionRef);

        const fetchedCollection = await getDocs(firestoreRefVal);
        let colData: T[] = [];
        if (fetchedCollection.size) {
            colData = fetchedCollection.docs.map(firestoreDocSerializer);
        }
        return receiveCollData(colData);
    });

    let watcher: null | (() => void) = null;
    const watchData = withError(function () {
        const firestoreRefVal =
            firestoreQuery.value !== null
                ? firestoreQuery.value
                : (firestoreRef.value as unknown as CollectionRef);

        watcher = onSnapshot(firestoreRefVal, (receivedCollection) => {
            receiveCollData(
                receivedCollection.size ? receivedCollection.docs.map(firestoreDocSerializer) : []
            );
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
            if (optsAreGetColl(options)) {
                getCollData()?.catch(showErrorMessage);
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
    };

    if (optsAreGetColl(options)) {
        return {
            ...returnVal,
            data: collectionData,
            getData: getCollData,
            firestoreQuery,
        };
    }

    return {
        ...returnVal,
        data: collectionData,
        watchData,
        stopWatchingData,
        firestoreQuery,
    };
}
