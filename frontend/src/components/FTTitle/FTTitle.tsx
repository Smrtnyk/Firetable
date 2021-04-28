import "./FTTitle.scss";

import { defineComponent } from "vue";

import { QCard } from "quasar";

export default defineComponent({
    name: "FTTitle",

    components: { QCard },

    props: {
        title: {
            type: String,
            required: true,
        },
    },
    setup(props, { slots }) {
        return () => (
            <q-card class="ft-card q-pa-sm q-mb-md">
                <div class="FTTitle items-center">
                    <h3 class="ft-title q-ma-none">{props.title}</h3>
                    <div class="text-right ft-title__right">
                        {slots.right?.()}
                    </div>
                </div>
            </q-card>
        );
    },
});
