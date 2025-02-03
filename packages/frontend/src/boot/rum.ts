import * as Sentry from "@sentry/vue";
import { boot } from "quasar/wrappers";
import { AppLogger } from "src/logger/FTLogger";

export default boot(async function ({ app, router }) {
    try {
        const sentryConfig = await fetch(new URL("./sentry.json", import.meta.url).href);
        const { dsn } = await sentryConfig.json();

        Sentry.init({
            app,
            dsn,
            environment: import.meta.env.PROD ? "production" : "development",
            hooks: ["mount", "update", "unmount"],
            integrations: [Sentry.browserTracingIntegration({ router })],
            tracesSampleRate: 1,
            trackComponents: true,
        });
    } catch (error) {
        AppLogger.error("Failed to initialize Sentry - continuing without monitoring", error);
    }
});
