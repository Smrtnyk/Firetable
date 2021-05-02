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

        q.iconMapFn = function (iconName: string) {
            const icon = myIcons[iconName];
            if (icon) {
                return { icon };
            }
        };

        q.dark.set(getDarkMode());

        return () => <router-view />;
    },
});
