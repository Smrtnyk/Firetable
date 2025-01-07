import type { DialogChainObject } from "quasar";
import type { Component } from "vue";
import type { ComponentProps } from "vue-component-type-helpers";
import type { AnyFunction } from "@firetable/types";
import { useQuasar } from "quasar";

type CreateOptions<C> = {
    component: Component;
    componentProps: {
        component: C;
        maximized?: boolean;
        componentPropsObject?: ComponentProps<C>;
        listeners: Record<string, AnyFunction>;
        title?: string;
    };
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useDialog() {
    const quasar = useQuasar();

    function createDialog<C>(options: CreateOptions<C>): DialogChainObject {
        return quasar.dialog(options);
    }

    return {
        createDialog,
    };
}
