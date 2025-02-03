import { Dark } from "quasar";
import { computed } from "vue";

export const isDark = computed(() => Dark.isActive);
