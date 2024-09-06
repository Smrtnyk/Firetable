import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";

export default boot(function ({ app }) {
    app.use(createPinia());
});
