import messages from "src/i18n";
import { createI18n } from "vue-i18n";
import { boot } from "quasar/wrappers";

export const i18n = createI18n({
    locale: "de",
    fallbackLocale: "en-GB",
    messages,
});

export default boot(({ app }) => {
    app.use(i18n);
});
