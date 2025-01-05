import { createI18n } from "vue-i18n";
import { boot } from "quasar/wrappers";
import { LocalStorage, Lang } from "quasar";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";

const DEFAULT_LANG = "en-GB";
const savedLanguage = LocalStorage.getItem<string>("FTLang") ?? DEFAULT_LANG;

export const i18n = createI18n({
    locale: savedLanguage,
    fallbackLocale: "en-GB",
    messages: {},
    legacy: false,
});

export function loadLanguage(langIso: string): Promise<{ default: Record<string, unknown> }> {
    // eslint-disable-next-line no-inline-comments -- needed for Vite
    return import(/* @vite-ignore */ `../i18n/${langIso}`);
}

export async function dynamicallySwitchLang(langIso: string): Promise<void> {
    if (!langIso) return;

    await tryCatchLoadingWrapper({
        async hook() {
            // Load Quasar language pack
            const quasarLangModule = await import(`../../node_modules/quasar/lang/${langIso}.js`);
            Lang.set(quasarLangModule.default);

            const messages = await loadLanguage(langIso);
            i18n.global.setLocaleMessage(langIso, messages.default);
            i18n.global.locale.value = langIso;

            LocalStorage.set("FTLang", langIso);
        },
    });
}

export default boot(async function ({ app }) {
    await dynamicallySwitchLang(savedLanguage);

    app.use(i18n);
});
