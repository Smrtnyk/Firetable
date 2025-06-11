<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits<(e: "toggle-drawer") => void>();
const menuLinks = [
    {
        icon: "fa fa-home",
        routeName: "home",
    },
    {
        icon: "fa fa-user-circle",
        routeName: "userProfile",
    },
];
</script>

<template>
    <q-header class="AppTopMenu">
        <q-tabs
            switch-indicator
            narrow-indicator
            class="bg-primary text-white AppTopMenu__tabs bg-primary col-xs-12 col-md-8 col-lg-6"
            active-color="white"
            :breakpoint="0"
        >
            <q-space />
            <q-route-tab
                v-for="menu in menuLinks"
                :key="menu.icon"
                :to="{ name: menu.routeName }"
                exact
                :icon="menu.icon"
                class="AppTopMenu__tab"
            />
            <q-space />
            <q-btn
                flat
                :aria-label="t('AppTopMenu.menuAriaLabel')"
                @click="emit('toggle-drawer')"
                class="AppTopMenu__menu-btn"
            >
                <q-icon size="1.25rem" name="fa fa-bars" />
            </q-btn>
        </q-tabs>
    </q-header>
</template>

<style lang="scss">
.AppTopMenu {
    background-color: transparent;

    &__tabs {
        padding: 0 1rem;
        min-height: 48px;
        height: 48px;

        .q-tabs__content {
            justify-content: space-evenly;
            height: 100%;
        }
    }

    &__tab {
        min-height: 48px;
        padding: 8px 16px;

        .q-tab__icon {
            font-size: 1.1rem;
        }
    }

    &__menu-btn {
        padding: 8px 12px;
        min-height: auto;
    }
}

@media (max-width: 768px) {
    .AppTopMenu {
        &__tabs {
            min-height: 44px;
            height: 44px;
            padding: 0 0.5rem;
        }

        &__tab {
            min-height: 44px;
            padding: 6px 12px;

            .q-tab__icon {
                font-size: 1rem;
            }
        }

        &__menu-btn {
            padding: 6px 10px;

            .q-icon {
                font-size: 1.1rem !important;
            }
        }
    }
}
</style>
