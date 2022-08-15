import { boot } from "quasar/wrappers";
import { onAuthStateChanged } from "@firebase/auth";
import { useAuthStore } from "src/stores/auth-store";
import { initializeFirebase, handleOnAuthStateChanged, routerBeforeEach } from "@firetable/backend";
import { showErrorMessage } from "@firetable/utils";

export default boot(({ router }) => {
    const { auth } = initializeFirebase();

    const authStore = useAuthStore();

    // Tell the application what to do when the
    // authentication state has changed */
    onAuthStateChanged(
        auth,
        handleOnAuthStateChanged.bind(null, router, authStore),
        showErrorMessage
    );

    // Setup the router to be intercepted on each route.
    // This allows the application to halt rendering until
    // Firebase is finished with its initialization process,
    // and handle the user accordingly
    routerBeforeEach(router, authStore);
});
