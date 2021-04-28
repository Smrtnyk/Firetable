import { useStore } from "src/store";
import { computed, defineComponent } from "vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { logoutUser } from "src/services/firebase/auth";
import { User } from "src/types";
import { useQuasar } from "quasar";
import { getDarkMode, myIcons } from "src/config";

export default defineComponent({
    name: "App",
    setup() {
        const q = useQuasar();
        const store = useStore();
        const user = computed(() => store.state.auth.user);
        const isReady = computed<boolean | null>(
            () => store.state.auth.isReady
        );
        const isAuthenticated = computed<boolean | null>(
            () => store.state.auth.isAuthenticated
        );

        function onLogoutUser() {
            void tryCatchLoadingWrapper(() => logoutUser());
        }

        q.iconMapFn = (iconName: string): { icon: string } | void => {
            const icon = myIcons[iconName];
            if (icon) {
                return { icon };
            }
        };

        q.dark.set(getDarkMode());

        return () => {
            if ((user.value && isReady.value) || !isAuthenticated.value) {
                return <router-view />;
            }

            if (isReady.value && !user.value) {
                return (
                    <div>
                        <h1>Something bad happened</h1>
                        <q-btn onClick={onLogoutUser}> logout </q-btn>
                    </div>
                );
            }
        };
    },
});
