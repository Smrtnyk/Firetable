import { computed } from "vue";
import { type DisplayInstance, useDisplay } from "vuetify";

// Vuetify's default breakpoints for reference:
// xs: 0 - 599
// sm: 600 - 959
// md: 960 - 1279
// lg: 1280 - 1919
// xl: 1920+

/**
 * Composable for screen detection using Vuetify's display service.
 *
 * @returns Reactive properties for screen size and derived states.
 */
export function useScreenDetection() {
    const display: DisplayInstance = useDisplay();

    const isMobile = computed(() => display.xs.value);
    const buttonSize = computed<"default" | "small">(() => (isMobile.value ? "small" : "default"));
    const isTablet = computed(() => display.sm.value);

    return {
        buttonSize,
        display,
        isMobile,
        isTablet,
    };
}
