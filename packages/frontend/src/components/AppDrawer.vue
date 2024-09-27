<script setup lang="ts">
import { Role } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { LocalStorage, Dark } from "quasar";
import { logoutUser } from "@firetable/backend";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { storeToRefs } from "pinia";
import { useAuthStore } from "src/stores/auth-store";

interface Props {
    modelValue: boolean;
}
const { nonNullableUser, isAdmin } = storeToRefs(useAuthStore());
const props = defineProps<Props>();
const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>();
const { t, locale } = useI18n();

const lang = ref(locale);
const langOptions = [
    { value: "en-GB", label: "English" },
    { value: "de", label: "German" },
];

const links = computed(() => {
    const role = nonNullableUser.value.role;
    const organisationId = nonNullableUser.value.organisationId;

    return [
        {
            icon: "home",
            route: { name: "adminOrganisations" },
            text: t("AppDrawer.links.manageOrganisations"),
            isVisible: isAdmin,
        },
        {
            icon: "calendar",
            route: { name: "adminEvents", params: { organisationId } },
            text: t("AppDrawer.links.manageEvents"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "users",
            route: { name: "adminUsers", params: { organisationId } },
            text: t("AppDrawer.links.manageUsers"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "arrow-expand",
            route: { name: "adminFloors", params: { organisationId } },
            text: t("AppDrawer.links.manageFloors"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "line-chart",
            route: { name: "adminAnalytics", params: { organisationId } },
            text: t("AppDrawer.links.manageAnalytics"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "cog-wheel",
            route: { name: "adminOrganisationSettings", params: { organisationId } },
            text: t("AppDrawer.links.settings"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "home",
            route: { name: "adminProperties", params: { organisationId } },
            text: t("AppDrawer.links.manageProperties"),
            isVisible: role === Role.PROPERTY_OWNER,
        },
    ].filter((link) => link.isVisible);
});

const avatar = computed(function () {
    const [first, last] = nonNullableUser.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

function setDarkMode(newValue: boolean): void {
    Dark.set(newValue);
    LocalStorage.set("FTDarkMode", newValue);
}

async function onLogoutUser(): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return logoutUser();
        },
    });
}

function setAppLanguage(val: string): void {
    LocalStorage.set("FTLang", val);
    locale.value = val;
}
</script>

<template>
    <q-drawer
        :model-value="props.modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        side="right"
        behavior="mobile"
        bordered
    >
        <q-list>
            <q-item header class="column items-center q-pt-xl q-pb-lg">
                <q-avatar size="6rem" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
                <div class="q-mt-md text-center">
                    <div class="text-subtitle1">{{ nonNullableUser.name }}</div>
                    <div class="text-caption text-grey">{{ nonNullableUser.email }}</div>
                </div>
            </q-item>

            <q-separator v-if="links.length > 0" />

            <q-item v-for="(link, index) in links" :key="index" :to="link.route" clickable>
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
                    :model-value="Dark.isActive"
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
