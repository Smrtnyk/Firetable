import { boot } from "quasar/wrappers";
import { showErrorMessage } from "src/helpers/ui-helpers";
import {
    handleOnAuthStateChanged,
    routerBeforeEach,
} from "src/services/firebase/auth";
import { auth, fBInit } from "../services/firebase/base";
import { onAuthStateChanged } from "firebase/auth";

export default boot(({ router, store }) => {
    fBInit({
        appId: "1:604176749699:web:cc48a2a03165a526",
        apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
        authDomain: `${process.env.VUE_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
        databaseURL: `https://${process.env.VUE_APP_FIREBASE_PROJECT_ID}.firebaseio.com`,
        projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.VUE_APP_FIREBASE_PROJECT_ID}.appspot.com`,
        messagingSenderId: process.env.VUE_APP_MESSENGER_SENDER_ID,
    });

    /* Tell the application what to do when the
       authentication state has changed */
    onAuthStateChanged(
        auth(),
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        handleOnAuthStateChanged.bind(null, router, store),
        showErrorMessage
    );

    /* Setup the router to be intercepted on each route.
       This allows the application to halt rendering until
       Firebase is finished with its initialization process,
       and handle the user accordingly */
    routerBeforeEach(router, store);
});
