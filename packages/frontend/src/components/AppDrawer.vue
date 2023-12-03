<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { LocalStorage, useQuasar } from "quasar";
import { useAuthStore } from "src/stores/auth-store";
import { useAppStore } from "src/stores/app-store";
import { logoutUser } from "@firetable/backend";
import { withLoading } from "src/helpers/ui-helpers";
import { ADMIN, Role, User } from "@firetable/types";

const appStore = useAppStore();
const authStore = useAuthStore();
const q = useQuasar();
const { t, locale } = useI18n();

const lang = ref(locale);
const langOptions = [
    { value: "en-GB", label: "English" },
    { value: "de", label: "German" },
];

const adminLinks = computed(() => {
    const links = [];
    const role = user.value.role;
    if (role === ADMIN) {
        links.push({
            icon: "home",
            route: {
                name: "adminOrganisations",
            },
            text: t("AppDrawer.links.manageOrganisations"),
        });
    }
    if (role === Role.PROPERTY_OWNER || role === Role.MANAGER) {
        links.push(
            {
                icon: "calendar",
                route: {
                    name: "adminEvents",
                    params: {
                        organisationId: user.value.organisationId,
                    },
                },
                text: t("AppDrawer.links.manageEvents"),
            },
            {
                icon: "users",
                route: {
                    name: "adminUsers",
                    params: {
                        organisationId: user.value.organisationId,
                    },
                },
                text: t("AppDrawer.links.manageUsers"),
            },
            {
                icon: "arrow-expand",
                route: {
                    name: "adminFloors",
                    params: {
                        organisationId: user.value.organisationId,
                    },
                },
                text: t("AppDrawer.links.manageFloors"),
            },
            {
                icon: "line-chart",
                route: {
                    name: "adminAnalytics",
                    params: {
                        organisationId: user.value.organisationId,
                    },
                },
                text: t("AppDrawer.links.manageAnalytics"),
            },
        );
    }
    if (role === Role.PROPERTY_OWNER) {
        links.push({
            icon: "home",
            route: {
                name: "adminProperties",
                params: {
                    organisationId: user.value.organisationId,
                },
            },
            text: t("AppDrawer.links.manageProperties"),
        });
    }

    return links;
});
const user = computed(() => authStore.user as unknown as NonNullable<User>);
const avatar = computed(() => {
    if (!user.value) return "";
    const [first, last] = user.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

function setDarkMode(newValue: boolean): void {
    q.dark.set(newValue);
    q.localStorage.set("FTDarkMode", newValue);
}

const onLogoutUser = withLoading(async function () {
    await logoutUser();
});

function setAppLanguage(val: string): void {
    LocalStorage.set("FTLang", val);
    locale.value = val;
}
</script>

<template>
    <q-drawer
        :model-value="appStore.showAppDrawer"
        @update:model-value="appStore.toggleAppDrawerVisibility"
        elevated
        side="right"
        overlay
        behavior="mobile"
    >
        <q-list>
            <q-item header class="column items-center q-pt-xl q-pb-lg" v-if="user">
                <q-avatar size="6rem" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
                <div class="q-mt-md text-center">
                    <div class="text-subtitle1">{{ user.name }}</div>
                    <div class="text-caption text-grey">{{ user.email }}</div>
                </div>
            </q-item>

            <q-separator v-if="adminLinks.length > 0" />

            <q-item v-for="(link, index) in adminLinks" :key="index" :to="link.route" clickable>
                <q-item-section avatar>
                    <q-icon :name="link.icon" />
                </q-item-section>
                <q-item-section>{{ link.text }}</q-item-section>
            </q-item>

            <q-separator spaced />

            <q-item clickable @click="onLogoutUser">
                <q-item-section avatar>
                    <q-icon name="logout" />
                </q-item-section>

                <q-item-section>{{ t("AppDrawer.links.logout") }}</q-item-section>
            </q-item>

            <q-separator spaced />
            <q-item>
                <q-select
                    :model-value="lang"
                    :options="langOptions"
                    label="Language"
                    dense
                    borderless
                    emit-value
                    map-options
                    options-dense
                    @update:model-value="setAppLanguage"
                />
            </q-item>
            <q-separator spaced />
            <q-item>
                <q-toggle
                    :model-value="q.dark.isActive"
                    @update:model-value="setDarkMode"
                    checked-icon="moon"
                    color="red"
                    :label="t('AppDrawer.toggles.darkMode')"
                    unchecked-icon="sun"
                    size="lg"
                />
            </q-item>
        </q-list>
    </q-drawer>
</template>

<style lang="scss">
.q-item.q-router-link--active {
    width: 95%;
    margin: auto;
    background: $gradient-primary;
    box-shadow: 0 0 10px 1px rgba($primary, 0.7);
    color: white;
    border-radius: $border-radius;
}
</style>
