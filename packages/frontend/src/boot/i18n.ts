import type { AnyFunction } from "@firetable/types";

import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { createI18n } from "vue-i18n";

const DEFAULT_LANG = "en-GB";
const savedLanguage = localStorage.getItem("FTLang") ?? DEFAULT_LANG;

const localMessages = import.meta.glob("../i18n/*/index.ts");
// const quasarMessages = import.meta.glob("../../node_modules/quasar/lang/*.js");

export const i18n = createI18n({
    fallbackLocale: "en-GB",
    legacy: false,
    locale: savedLanguage,
    messages: {},
});

export async function dynamicallySwitchLang(langIso: string): Promise<void> {
    if (!langIso) return;

    await tryCatchLoadingWrapper({
        async hook() {
            // const quasarLangPath = `../../node_modules/quasar/lang/${langIso}.js`;
            const localMessagesPath = `../i18n/${langIso}/index.ts`;

            // if (quasarMessages[quasarLangPath]) {
            //     const quasarLangModule = await (quasarMessages[quasarLangPath] as AnyFunction)();
            //     Lang.set(quasarLangModule.default);
            // }

            if (localMessages[localMessagesPath]) {
                const messages = await (localMessages[localMessagesPath] as AnyFunction)();
                i18n.global.setLocaleMessage(langIso, messages.default);
                i18n.global.locale.value = langIso;
                localStorage.setItem("FTLang", langIso);
            }
        },
    });
}

// @ts-expect-error -- FIXME type this propery
export async function initLang(app) {
    await dynamicallySwitchLang(savedLanguage);

    app.use(i18n);
}

/**
 * Used in unit tests to load language files.
 * @param langIso ISO code of the language to load.
 */
export function loadLanguage(langIso: string): Promise<{ default: Record<string, unknown> }> {
    const localMessagesPath = `../i18n/${langIso}/index.ts`;
    return (localMessages[localMessagesPath] as AnyFunction)();
}
