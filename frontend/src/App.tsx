import { defineComponent } from "vue";
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
