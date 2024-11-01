import { boot } from "quasar/wrappers";
import * as Sentry from "@sentry/vue";
import { AppLogger } from "src/logger/FTLogger";

export default boot(async function ({ app, router }) {
    try {
        const sentryConfig = await fetch(new URL("./sentry.json", import.meta.url).href);
        const { dsn } = await sentryConfig.json();

        Sentry.init({
            app,
            dsn,
            tracesSampleRate: 1,
            environment: import.meta.env.PROD ? "production" : "development",
            integrations: [Sentry.browserTracingIntegration({ router })],
            trackComponents: true,
            hooks: ["mount", "update", "unmount"],
        });
    } catch (error) {
        AppLogger.error("Failed to initialize Sentry - continuing without monitoring", error);
    }
});
