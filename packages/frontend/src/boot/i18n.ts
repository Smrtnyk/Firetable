import type { AnyFunction } from "@firetable/types";

import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { createI18n } from "vue-i18n";

const LANG_STORAGE_KEY = "FTLangV2";
const DEFAULT_LANG = "en-GB";
const savedLanguage = localStorage.getItem(LANG_STORAGE_KEY) ?? DEFAULT_LANG;
const localMessages = import.meta.glob("../i18n/*/index.ts");

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
            const localMessagesPath = `../i18n/${langIso}/index.ts`;

            if (localMessages[localMessagesPath]) {
                const messages = await (localMessages[localMessagesPath] as AnyFunction)();
                i18n.global.setLocaleMessage(langIso, messages.default);
                i18n.global.locale.value = langIso;
                localStorage.setItem(LANG_STORAGE_KEY, langIso);
            }
        },
    });
}

export async function initLang(): Promise<void> {
    await dynamicallySwitchLang(savedLanguage);
}

/**
 * Used in unit tests to load language files.
 * @param langIso ISO code of the language to load.
 */
export function loadLanguage(langIso: string): Promise<{ default: Record<string, unknown> }> {
    const localMessagesPath = `../i18n/${langIso}/index.ts`;
    return (localMessages[localMessagesPath] as AnyFunction)();
}
