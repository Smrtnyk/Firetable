import type { UnwrapRef, WritableComputedRef } from "vue";
import type { RenderResult } from "vitest-browser-vue";
import type { TestingOptions } from "@pinia/testing";
import type { Store, StoreDefinition } from "pinia";
import type { Mock } from "vitest";
import messages from "../src/i18n";
import { myIcons } from "src/config";
import {
    QDialog,
    QAvatar,
    QBtn,
    QDrawer,
    QIcon,
    QInput,
    QItem,
    QItemLabel,
    QItemSection,
    QLayout,
    QList,
    QPageSticky,
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
    IconSet,
    BottomSheet,
    Loading,
    Dialog,
    Notify,
} from "quasar";
import { h, defineComponent } from "vue";
import { render } from "vitest-browser-vue";
import { createI18n } from "vue-i18n";
import { vi } from "vitest";

import "quasar/dist/quasar.css";
import "../src/css/app.scss";
import { createTestingPinia } from "@pinia/testing";

document.body.style.height = "100vh";
document.body.style.width = "100vw";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

export const t = i18n.global.t;
export const locale = i18n.global.locale;
export function getLocaleForTest(): WritableComputedRef<"de" | "en-GB", "de" | "en-GB"> {
    return i18n.global.locale;
}

/**
 * Function to render a component with Quasar plugins and components.
 * Also registers the i18n plugin with messages.
 */
export function renderComponent(
    component: Parameters<typeof render>[0],
    props?: any,
    options?: {
        wrapInLayout?: boolean;
        piniaStoreOptions?: Partial<TestingOptions>;
        provide?: Record<PropertyKey, unknown>;
    },
): RenderResult<any> {
    const wrapInLayout = options?.wrapInLayout ?? false;

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
            plugins: [
                createTestingPinia({
                    stubActions: false,
                    ...options?.piniaStoreOptions,
                    createSpy: vi.fn,
                }),
                [Quasar, { plugins: { BottomSheet, Loading, Dialog, Notify } }],
                i18n,
            ],
            provide: options?.provide,
            components: {
                QInput,
                QSelect,
                QBtn,
                QTable,
                QTd,
                QIcon,
                QScrollArea,
                QPageSticky,
                QTimeline,
                QTimelineEntry,
                QLayout,
                QItem,
                QItemSection,
                QSlideItem,
                QItemLabel,
                QAvatar,
                QSeparator,
                QDrawer,
                QToggle,
                QList,
                QDialog,
            },
        },
    };
    if (props && !wrapInLayout) {
        renderOptions.props = props;
    }

    Quasar.iconSet.iconMapFn = function (iconName) {
        return { icon: myIcons[iconName] };
    };

    const result = render(componentToRender, renderOptions);

    IconSet.props.name = "line-awesome";

    return result;
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
