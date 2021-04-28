import auth from "./auth";

import { createStore, Store, useStore as vuexStore } from "vuex";
import { InjectionKey } from "vue";
import { store } from "quasar/wrappers";
import { vuexfireMutations } from "vuexfire";
import { AuthState } from "src/store/auth/state";

interface State {
    auth: AuthState;
}

export const storeKey: InjectionKey<Store<State>> = Symbol();

export default store(function () {
    return createStore<State>({
        mutations: { ...vuexfireMutations },
        modules: { auth },
        strict: !!process.env.DEV,
    });
});

export function useStore(): Store<State> {
    return vuexStore(storeKey);
}
