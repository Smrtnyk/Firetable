import { computed } from "vue";
import { Dark } from "quasar";

export const isDark = computed(() => Dark.isActive);
