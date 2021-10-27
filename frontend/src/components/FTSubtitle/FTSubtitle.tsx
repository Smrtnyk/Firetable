import "./FTSubtitle.scss";

import { defineComponent } from "vue";

export default defineComponent({
    name: "FTSubtitle",

    setup(_, { slots }) {
        return () => <h3 class="ft-subtitle font-black">{slots.default?.()}</h3>;
    },
});
