import { computed } from "vue";
import { Screen } from "quasar";

export const isMobile = computed(() => Screen.lt.sm);
export const buttonSize = computed(() => {
    return isMobile.value ? "sm" : "md";
});

export const isTablet = computed(() => {
    return Screen.lt.md;
});
