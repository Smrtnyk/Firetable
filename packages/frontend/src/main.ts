import { noop } from "es-toolkit";
import { createPinia } from "pinia";
import { initFirebaseAndAuth } from "src/boot/firebase-connection";
import { i18n, initLang } from "src/boot/i18n";
import { vuetifyApp } from "src/vuetify-app";
import "virtual:pwa-register";
import { createApp, h } from "vue";

import App from "./App.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import router from "./router";

const pinia = createPinia();

const vueApp = createApp({
    render: () =>
        h(ErrorBoundary, null, {
            default: () => h(App),
        }),
});
vueApp.component("ErrorBoundary", ErrorBoundary);
vueApp.use(router);
vueApp.use(pinia);
vueApp.use(i18n);
vueApp.use(vuetifyApp);
initFirebaseAndAuth(vueApp);
initLang()
    // eslint-disable-next-line promise/always-return -- LOL
    .then(function () {
        vueApp.mount("#app");
    })
    .catch(noop);
