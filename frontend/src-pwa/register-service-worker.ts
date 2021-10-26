import { register } from "register-service-worker";
import { Notify } from "quasar";

/* The ready(), registered(), cached(), updatefound() and updated()
   events passes a ServiceWorkerRegistration instance in their arguments.
   ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration */

// eslint-disable-next-line no-undef
register(process.env.SERVICE_WORKER_FILE, {
    /* The registrationOptions object will be passed as the second argument
       to ServiceWorkerContainer.register()
       https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter */

    // RegistrationOptions: { scope: './' },

    ready(registration) {
        // eslint-disable-next-line no-console
        console.log("App is being served from cache by a service worker.");
    },

    registered(registration) {
        console.log("Service worker has been registered.");
    },

    cached(registration) {
        console.log("Content has been cached for offline use.");
    },

    updatefound(registration) {
        console.log("New content is downloading.");
    },

    updated(/* registration */) {
        Notify.create({
            message: "New content available!",
            icon: "cloud_download",
            closeBtn: "Refresh",
            timeout: 10000,
            onDismiss() {
                location.reload();
            },
        });
    },

    offline() {
        console.log(
            "No internet connection found. App is running in offline mode."
        );
    },

    error(err) {
        console.error("Error during service worker registration:", err);
    },
});
