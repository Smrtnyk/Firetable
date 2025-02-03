import type { Ref } from "vue";

import { cloneDeep, isEqual } from "es-toolkit";
import { isRef, ref, watch } from "vue";

type UseHasChangedReturnType = {
    hasChanged: Ref<boolean>;
    reset: () => void;
};

export function useHasChanged<T extends object>(source: Ref<T> | T): UseHasChangedReturnType {
    const hasChanged = ref(false);
    let original = cloneDeep(isRef(source) ? source.value : source);

    watch(
        () => (isRef(source) ? source.value : source),
        function (newVal) {
            hasChanged.value = !isEqual(newVal, original);
        },
        { deep: true, flush: "sync" },
    );

    function reset(): void {
        original = cloneDeep(isRef(source) ? source.value : source);
        hasChanged.value = false;
    }

    return {
        hasChanged,
        reset,
    };
}
