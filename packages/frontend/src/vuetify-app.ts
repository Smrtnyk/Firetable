import { currentLocale } from "src/helpers/date-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, fa } from "vuetify/iconsets/fa";
import { VCalendar } from "vuetify/labs/VCalendar";
import { VDateInput } from "vuetify/labs/VDateInput";
import { VTimePicker } from "vuetify/labs/VTimePicker";
import { de, en, es, hr } from "vuetify/locale";
import "@fortawesome/fontawesome-free/css/all.css";
import "vuetify/styles";
import "src/css/app.scss";

export const vuetifyApp = createVuetify({
    components: {
        ...components,
        VCalendar,
        VDateInput,
        VTimePicker,
    },
    date: {
        locale: {
            en: currentLocale,
        },
    },
    defaults: {
        global: {
            style: { fontFamily: "'Inter', sans-serif" },
        },
    },
    directives,
    icons: {
        aliases,
        defaultSet: "fa",
        sets: {
            fa,
        },
    },
    locale: {
        fallback: "en",
        locale: "en",
        messages: { de, en, es, hr },
    },
    theme: {
        defaultTheme: "dark",
        themes: {
            dark: {
                colors: {
                    background: "#1F1D2B",
                    error: "#CF6679",
                    info: "#64B5F6",
                    onBackground: "#EAEAEC",
                    onPrimary: "#000000",
                    onSecondary: "#000000",
                    onSurface: "#EAEAEC",
                    primary: "#BB86FC",
                    secondary: "#FFAB40",
                    success: "#81C784",
                    surface: "#252836",
                    tertiary: "#4ECDC4",
                    warning: "#FFD54F",
                },
                dark: true,
            },
            light: {
                colors: {
                    info: "#31CCEC",
                    primary: "#6247aa",
                    quaternary: "#47AA93",
                    secondary: "#42a497",
                    success: "rgb(40,199,111)",
                    tertiary: "#AA475E",
                    warning: "rgb(255,159,67)",
                },
                dark: false,
            },
        },
    },
});
