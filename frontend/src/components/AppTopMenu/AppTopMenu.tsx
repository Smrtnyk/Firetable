import "./AppTopMenu.scss";

import { defineComponent } from "vue";

import { QPageSticky, QTabs, QBtn, QIcon, QSpace, QRouteTab } from "quasar";

const menuLinks = [
    {
        icon: "home",
        routeName: "home",
    },
    {
        icon: "user-circle",
        routeName: "userProfile",
    },
];

export default defineComponent({
    name: "AppTopMenu",

    components: { QPageSticky, QTabs, QBtn, QIcon, QSpace, QRouteTab },

    emits: ["toggle"],

    setup(_, { emit }) {
        return () => (
            <q-page-sticky expand position="bottom" class="shadow-light AppTopMenu">
                <q-tabs
                    switch-indicator
                    narrow-indicator
                    class="text-white AppTopMenu__tabs bg-primary col-xs-12 col-md-8 col-lg-6"
                    active-color="white"
                    breakpoint={0}
                >
                    <q-btn flat aria-label="Menu" onClick={() => emit("toggle")}>
                        <q-icon class="text-gradient" size="2rem" name="menu" />
                    </q-btn>
                    <q-space />
                    {menuLinks.map((menu) => (
                        <q-route-tab
                            key={menu.icon}
                            to={{ name: menu.routeName }}
                            exact
                            icon={menu.icon}
                        />
                    ))}
                </q-tabs>
            </q-page-sticky>
        );
    },
});
