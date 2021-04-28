import { defineComponent } from "vue";

import { FTTitle } from "components/FTTitle";

export default defineComponent({
    name: "PageAdminEventEdit",

    components: { FTTitle },

    setup() {
        return () => <f-t-title title="Event Edit" />;
    },
});
