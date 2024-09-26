import type { DefineComponent, ExtractPropTypes, WritableComputedRef } from "vue";
import type { QuasarPluginOptions } from "quasar";
import messages from "../src/i18n";
import { ref, h, defineComponent } from "vue";
import { render } from "vitest-browser-vue";
import {
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
} from "quasar";
import { createI18n } from "vue-i18n";
import { config } from "@vue/test-utils";
import { beforeAll, afterAll, vi } from "vitest";

import "quasar/dist/quasar.css";
import "../src/css/app.scss";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

export const t = i18n.global.t;
export function getLocaleForTest(): WritableComputedRef<"de" | "en-GB", "de" | "en-GB"> {
    return i18n.global.locale;
}

export function installQuasarPlugin(options?: Partial<QuasarPluginOptions>): void {
    const globalConfigBackup = structuredClone(config.global);

    beforeAll(() => {
        config.global.plugins.unshift([Quasar, options]);
        config.global.provide = {
            ...config.global.provide,
            ...qLayoutInjections(),
        };
    });

    afterAll(() => {
        config.global = globalConfigBackup;
    });
}

/**
 * Injections for Components with a QPage root Element
 */
export function qLayoutInjections() {
    return {
        // pageContainerKey
        _q_pc_: true,
        // layoutKey
        _q_l_: {
            header: { size: 0, offset: 0, space: false },
            right: { size: 300, offset: 0, space: false },
            footer: { size: 0, offset: 0, space: false },
            left: { size: 300, offset: 0, space: false },
            isContainer: ref(false),
            view: ref("lHh Lpr lff"),
            rows: ref({ top: "lHh", middle: "Lpr", bottom: "lff" }),
            height: ref(900),
            instances: {},
            update: vi.fn(),
            animate: vi.fn(),
            totalWidth: ref(1200),
            scroll: ref({ position: 0, direction: "up" }),
            scrollbarWidth: ref(125),
        },
    };
}

/**
 * Function to render a component with Quasar plugins and components.
 * Also registers the i18n plugin with messages.
 */
export function renderComponent<
    TComponent extends DefineComponent<Record<string, unknown>, Record<string, unknown>, any>,
    TProps = Readonly<ExtractPropTypes<TComponent["__props"]>>,
>(component: TComponent, props?: Partial<TProps>, options?: { wrapInLayout?: boolean }) {
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
                              default: () => h(component, props),
                          },
                      );
              },
          })
        : component;

    const renderOptions: any = {
        global: {
            plugins: [Quasar, i18n],
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
            },
        },
    };
    if (props && !wrapInLayout) {
        renderOptions.props = props;
    }

    return render(componentToRender, renderOptions);
}
