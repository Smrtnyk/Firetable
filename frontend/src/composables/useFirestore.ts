import { computed, nextTick, onUnmounted, ref, Ref, watch } from "vue";

import { OptionsCollection } from "./types/Options";
import { ReturnCollGet, ReturnCollWatch } from "./types/Return";
import { optsAreGetColl } from "./types/type-guards";
import { firestore } from "src/services/firebase/base";
import { onSnapshot, collection, getDocs } from "@firebase/firestore";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { calculatePath, firestoreDocSerializer, withError } from "src/composables/types/utils";

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
    const inComponent = options.inComponent ?? true;
    const pathReplaced = computed(() => {
        const { path, variables } = options;
        return calculatePath(path, variables);
    });
    const firestoreRef = computed(() => collection(firestore(), pathReplaced.value));
    const firestoreQuery = computed(() => {
        return options.query?.(firestoreRef.value);
    });

    function receiveCollData(receivedData: T[]) {
        mutatedData.value = options.mutate?.(receivedData);
        options.onReceive?.(receivedData, mutatedData.value);
        collectionData.value = receivedData;
        received.value = true;
        loading.value = false;
        return {
            data: receivedData,
            mutatedData: mutatedData.value,
        };
    }

    const getCollData = withError(options.onError, async () => {
        const firestoreRefVal = firestoreQuery.value ?? firestoreRef.value;

        const fetchedCollection = await getDocs(firestoreRefVal);
        let colData: T[] = [];
        if (fetchedCollection.size) {
            colData = fetchedCollection.docs.map((doc) => {
                return firestoreDocSerializer(doc);
            });
        }
        return receiveCollData(colData);
    });

    let watcher: null | (() => void) = null;
    const watchData = withError(options.onError, function () {
        const firestoreRefVal = firestoreQuery.value ?? firestoreRef.value;

        watcher = onSnapshot(firestoreRefVal, (receivedCollection) => {
            receiveCollData(
                receivedCollection.size
                    ? receivedCollection.docs.map((doc) => {
                          return firestoreDocSerializer(doc);
                      })
                    : []
            );
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
            if (!firestoreRef.value) return;

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

    const returnVal = {
        mutatedData,
        loading,
        received,
        pathReplaced,
        firestoreRef,
        data: collectionData,
        firestoreQuery,
    };

    if (optsAreGetColl(options)) {
        return {
            ...returnVal,
            getData: getCollData,
        };
    }

    return {
        ...returnVal,
        watchData,
        stopWatchingData,
    };
}
