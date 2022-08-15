import messages from "src/i18n";
import { createI18n } from "vue-i18n";
import { boot } from "quasar/wrappers";
import { LocalStorage } from "quasar";

const savedLanguage = LocalStorage.getItem<string>("FTLang") ?? "de";

const i18n = createI18n({
    locale: savedLanguage,
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

export default boot(({ app }) => {
    app.use(i18n);
});
