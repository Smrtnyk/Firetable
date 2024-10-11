import type { DialogChainObject } from "quasar";
import type { Component } from "vue";
import type { ComponentProps } from "vue-component-type-helpers";
import { useQuasar } from "quasar";

type CreateOptions<C> = {
    component: Component;
    componentProps: {
        component: C;
        maximized?: boolean;
        componentPropsObject?: ComponentProps<C>;
        listeners?: Record<string, (...args: any[]) => any>;
        title?: string;
    };
};

export function useDialog() {
    const quasar = useQuasar();

    function createDialog<C>(options: CreateOptions<C>): DialogChainObject {
        return quasar.dialog(options);
    }

    return {
        createDialog,
    };
}
