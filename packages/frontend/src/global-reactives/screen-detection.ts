import { computed } from "vue";
import { Screen } from "quasar";

export const isMobile = computed(function () {
    return Screen.lt.sm;
});
export const buttonSize = computed(function () {
    return isMobile.value ? "sm" : "md";
});

export const isTablet = computed(function () {
    return Screen.lt.md;
});
