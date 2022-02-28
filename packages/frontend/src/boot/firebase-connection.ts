import { boot } from "quasar/wrappers";
import { onAuthStateChanged } from "@firebase/auth";
import { useAuthStore } from "src/stores/auth-store";
import { auth, fBInit, handleOnAuthStateChanged, routerBeforeEach } from "@firetable/backend";
import { showErrorMessage } from "@firetable/utils";

export default boot(({ router }) => {
    if (!process.env.VUE_APP_FIREBASE_API_KEY) {
        showErrorMessage("Firebase credentials missing!");
        return;
    }
    fBInit({
        appId: "1:604176749699:web:cc48a2a03165a526",
        apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
        authDomain: `${process.env.VUE_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        databaseURL: `https://${process.env.VUE_APP_FIREBASE_PROJECT_ID}.firebaseio.com`,
        projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.VUE_APP_FIREBASE_PROJECT_ID}.appspot.com`,
        messagingSenderId: process.env.VUE_APP_MESSENGER_SENDER_ID,
    });

    const authStore = useAuthStore();

    // Tell the application what to do when the
    // authentication state has changed */
    onAuthStateChanged(
        auth(),
        handleOnAuthStateChanged.bind(null, router, authStore),
        showErrorMessage
    );

    // Setup the router to be intercepted on each route.
    // This allows the application to halt rendering until
    // Firebase is finished with its initialization process,
    // and handle the user accordingly
    routerBeforeEach(router, authStore);
});
