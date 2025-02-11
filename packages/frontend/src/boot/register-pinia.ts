import { createPinia } from "pinia";
import { boot } from "quasar/wrappers";

export default boot(function ({ app }) {
    app.use(createPinia());
});
