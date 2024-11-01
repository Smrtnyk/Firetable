import { boot } from "quasar/wrappers";
import * as Sentry from "@sentry/vue";
import { AppLogger } from "src/logger/FTLogger";

export default boot(async function ({ app, router }) {
    try {
        const sentryCreds = await import("./sentry.json");

        Sentry.init({
            app,
            dsn: sentryCreds.dsn,
            tracesSampleRate: 1,
            environment: import.meta.env.PROD ? "production" : "development",
            integrations: [Sentry.browserTracingIntegration({ router })],
            trackComponents: true,
            hooks: ["mount", "update", "unmount"],
        });
    } catch (e) {
        AppLogger.error("Failed to initialize Sentry", e);
    }
});
