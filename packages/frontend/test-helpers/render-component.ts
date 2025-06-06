import type { TestingOptions } from "@pinia/testing";
import type { Store, StoreDefinition } from "pinia";
import type { Mock } from "vitest";
import type { RenderResult } from "vitest-browser-vue";
import type { UnwrapRef, WritableComputedRef } from "vue";

import { createTestingPinia } from "@pinia/testing";
import {
    BottomSheet,
    Dialog,
    Loading,
    Notify,
    QAvatar,
    QBtn,
    QDialog,
    QDrawer,
    QIcon,
    QInput,
    QItem,
    QItemLabel,
    QItemSection,
    QLayout,
    QList,
    QMenu,
    QPageSticky,
    QRadio,
    QScrollArea,
    QSelect,
    QSeparator,
    QSlideItem,
    QTable,
    QTd,
    QTimeline,
    QTimelineEntry,
    QToggle,
    Quasar,
} from "quasar";
import fontAwesomeV6 from "quasar/icon-set/fontawesome-v6";
import { i18n, loadLanguage } from "src/boot/i18n";
import { vi } from "vitest";
import { render } from "vitest-browser-vue";
import { defineComponent, h } from "vue";
import "quasar/dist/quasar.css";
import "@quasar/extras/fontawesome-v6/fontawesome-v6.css";

import "../src/css/app.scss";

document.body.style.height = "100vh";
document.body.style.width = "100vw";

const languageStrings = await loadLanguage("en-GB");
i18n.global.locale.value = "en-GB";
i18n.global.setLocaleMessage("en-GB", languageStrings.default);

export const t = i18n.global.t;
export function getLocaleForTest(): WritableComputedRef<string, string> {
    return i18n.global.locale;
}

export function mockedStore<TStoreDef extends () => unknown>(
    useStore: TStoreDef,
): TStoreDef extends StoreDefinition<infer Id, infer State, infer Getters, infer Actions>
    ? Store<
          Id,
          State,
          Record<string, never>,
          {
              [K in keyof Actions]: Actions[K] extends (...args: any[]) => any
                  ? Mock<Actions[K]>
                  : Actions[K];
          }
      > & {
          [K in keyof Getters]: UnwrapRef<Getters[K]>;
      }
    : ReturnType<TStoreDef> {
    return useStore() as any;
}

/**
 * Function to render a component with Quasar plugins and components.
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

    const componentToRender = wrapInLayout
        ? defineComponent({
              components: { QLayout },
              setup() {
                  return () =>
                      h(
                          QLayout,
                          {},
                          {
                              // @ts-expect-error -- not sure why this is not working
                              default: () => h(component, props),
                          },
                      );
              },
          })
        : component;

    const renderOptions: any = {
        global: {
            components: {
                QAvatar,
                QBtn,
                QDialog,
                QDrawer,
                QIcon,
                QInput,
                QItem,
                QItemLabel,
                QItemSection,
                QLayout,
                QList,
                QMenu,
                QPageSticky,
                QRadio,
                QScrollArea,
                QSelect,
                QSeparator,
                QSlideItem,
                QTable,
                QTd,
                QTimeline,
                QTimelineEntry,
                QToggle,
            },
            plugins: [
                createTestingPinia({
                    stubActions: false,
                    ...options?.piniaStoreOptions,
                    createSpy: vi.fn,
                    fakeApp: true,
                }),
                [
                    Quasar,
                    {
                        iconSet: fontAwesomeV6,
                        plugins: { BottomSheet, Dialog, Loading, Notify },
                    },
                ],
                i18n,
            ],
            provide: options?.provide,
        },
    };
    if (props && !wrapInLayout) {
        renderOptions.props = props;
    }

    return render(componentToRender, renderOptions);
}
