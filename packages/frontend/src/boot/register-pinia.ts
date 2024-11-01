import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";
import { AppLogger } from "src/logger/FTLogger";

export default boot(async function ({ app }) {
    const pinia = createPinia();
    try {
        const { createSentryPiniaPlugin } = await import("@sentry/vue");
        pinia.use(createSentryPiniaPlugin());
    } catch (e) {
        AppLogger.error("Failed to initialize Pinia", e);
    }
    app.use(pinia);
});
