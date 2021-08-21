import auth from "./auth";
import events from "./events";

import { createStore, Store, useStore as vuexStore } from "vuex";
import { InjectionKey } from "vue";
import { store } from "quasar/wrappers";
import type { State } from "./types";

export const storeKey: InjectionKey<Store<State>> = Symbol();

export default store(function () {
    return createStore<State>({
        modules: { auth, events },
        strict: !!process.env.DEV,
    });
});

export function useStore(): Store<State> {
    return vuexStore(storeKey);
}
