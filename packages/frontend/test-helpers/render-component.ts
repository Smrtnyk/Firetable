import type { DefineComponent, ExtractPropTypes } from "vue";
import messages from "../src/i18n";
import { h, defineComponent } from "vue";
import { render } from "vitest-browser-vue";
import {
    QBtn,
    QIcon,
    QInput,
    QItem,
    QItemLabel,
    QItemSection,
    QLayout,
    QPageSticky,
    QScrollArea,
    QSelect,
    QSlideItem,
    QTable,
    QTd,
    QTimeline,
    QTimelineEntry,
    Quasar,
} from "quasar";
import { createI18n } from "vue-i18n";

import "quasar/dist/quasar.css";
import "../src/css/app.scss";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

export const t = i18n.global.t;

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
            },
        },
    };
    if (props && !wrapInLayout) {
        renderOptions.props = props;
    }

    return render(componentToRender, renderOptions);
}
