import { computed } from "vue";
import { Screen } from "quasar";

export const isMobile = computed(() => Screen.lt.sm);
