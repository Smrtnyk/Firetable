import { computed, defineComponent, ref, resolveDynamicComponent, Transition } from "vue";

// Components
import AppDrawer from "src/components/AppDrawer/AppDrawer";
import { AppTopMenu } from "src/components/AppTopMenu";

import { QLayout, QDrawer, QPage, QPageContainer } from "quasar";
import { Component as DynamicComponent } from "@vue/runtime-core";
import { useAuthStore } from "src/stores/auth-store";

export default defineComponent({
    name: "MyLayout",

    components: {
        AppTopMenu,
        AppDrawer,
        QLayout,
        QDrawer,
        QPage,
        QPageContainer,
    },

    setup() {
        const authStore = useAuthStore();
        const isDrawerOpen = ref(false);
        const isLoggedIn = computed(() => authStore.isLoggedIn);
        const isAdmin = computed(() => authStore.isAdmin);

        function onDrawerToggle() {
            isDrawerOpen.value = !isDrawerOpen.value;
        }

        return () => {
            if (!isLoggedIn.value) {
                return <div />;
            }

            return (
                <q-layout view="hHh lpR fFf">
                    <q-drawer
                        v-model={isDrawerOpen.value}
                        class="Drawer"
                        show-if-above
                        bordered
                        side="right"
                    >
                        <app-drawer show-admin-links={isAdmin.value} />
                    </q-drawer>
                    <q-page-container>
                        <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md fit row wrap justify-start items-start content-start">
                            <router-view
                                style="padding-bottom: 51px"
                                class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3"
                            >
                                {({ Component }: { Component: DynamicComponent }) => (
                                    <Transition name="fade" mode="out-in">
                                        {() => resolveDynamicComponent(Component)}
                                    </Transition>
                                )}
                            </router-view>
                        </q-page>

                        <app-top-menu onToggle={onDrawerToggle} />
                    </q-page-container>
                </q-layout>
            );
        };
    },
});
