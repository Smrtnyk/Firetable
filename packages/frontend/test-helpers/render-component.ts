import type { TestingOptions } from "@pinia/testing";
import type { RenderResult } from "vitest-browser-vue";
import type { WritableComputedRef } from "vue";

import { createTestingPinia } from "@pinia/testing";
import { i18n, loadLanguage } from "src/boot/i18n";
import { vuetifyApp } from "src/vuetify-app";
import { vi } from "vitest";
import { render } from "vitest-browser-vue";

document.body.style.height = "100vh";
document.body.style.width = "100vw";

const languageStrings = await loadLanguage("en-GB");
i18n.global.locale.value = "en-GB";
i18n.global.setLocaleMessage("en-GB", languageStrings.default);

export const t = i18n.global.t;
export function getLocaleForTest(): WritableComputedRef<string, string> {
    return i18n.global.locale;
}

/**
 * Function to render a component with Vuetify plugins and components.
 * Also registers the i18n plugin with messages.
 */
export function renderComponent<T>(
    component: Parameters<typeof render>[0],
    props?: any,
    options?: {
        piniaStoreOptions?: Partial<TestingOptions>;
        provide?: Record<PropertyKey, unknown>;
        wrapInLayout?: boolean;
    },
): RenderResult<T> {
    const wrapInLayout = options?.wrapInLayout ?? false;
    i18n.global.setLocaleMessage("en-GB", languageStrings.default);
    i18n.global.locale.value = "en-GB";

    const renderOptions: any = {
        global: {
            plugins: [
                createTestingPinia({
                    stubActions: false,
                    ...options?.piniaStoreOptions,
                    createSpy: vi.fn,
                    fakeApp: true,
                }),
                vuetifyApp,
                i18n,
            ],
            provide: options?.provide,
        },
    };

    if (props && !wrapInLayout) {
        renderOptions.props = props;
    }

    return render(component, renderOptions);
}
