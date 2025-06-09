import type { ComputedRef } from "vue";
import type { ThemeInstance } from "vuetify";

import { computed } from "vue";
import { useTheme } from "vuetify";

export function useAppTheme(): {
    isDark: ComputedRef<boolean>;
    loadTheme: () => void;
    theme: ThemeInstance;
    toggleTheme: () => void;
} {
    const theme = useTheme();
    const isDark = computed(() => theme.global.current.value.dark);

    function toggleTheme(): void {
        theme.global.name.value = isDark.value ? "light" : "dark";
        localStorage.setItem("theme", theme.global.name.value);
    }

    function loadTheme(): void {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
            theme.global.name.value = savedTheme;
        }
    }

    return {
        isDark,
        loadTheme,
        theme,
        toggleTheme,
    };
}
