import { defineComponent } from "vue";
import { useRouter } from "vue-router";

import { QBtn } from "quasar";

export default defineComponent({
    name: "CatchAllPage",

    components: { QBtn },

    setup() {
        const router = useRouter();

        return () => (
            <div class="fixed-center text-center">
                <p class="text-faded">
                    Sorry, nothing here...<strong>(404)</strong>
                </p>
                <q-btn
                    rounded
                    class="button-gradient"
                    style="width: 200px"
                    onClick={() => router.push("/")}
                >
                    Go back
                </q-btn>
            </div>
        );
    },
});
