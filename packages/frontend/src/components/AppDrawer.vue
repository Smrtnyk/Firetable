<script setup lang="ts">
import type { GuardedLink, LinkWithChildren } from "src/types";
import { Role } from "@firetable/types";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { LocalStorage, Dark } from "quasar";
import { logoutUser } from "@firetable/backend";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { storeToRefs } from "pinia";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";

interface Props {
    modelValue: boolean;
}
const { nonNullableUser, isAdmin, canSeeInventory } = storeToRefs(useAuthStore());
const propertiesStore = usePropertiesStore();
const props = defineProps<Props>();
const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>();
const { t, locale } = useI18n();

const lang = ref(locale);
const langOptions = [
    { value: "en-GB", label: "English" },
    { value: "de", label: "German" },
];

const inventoryLink = computed<GuardedLink | LinkWithChildren | undefined>(function () {
    const shouldShowInventoryLinks = !isAdmin.value && canSeeInventory.value;
    if (!shouldShowInventoryLinks) {
        return;
    }

    const properties = propertiesStore.getPropertiesByOrganisationId(
        nonNullableUser.value.organisationId,
    );

    if (properties.length === 0) {
        return;
    }

    if (properties.length === 1) {
        const property = properties[0];
        return {
            icon: "grid",
            route: {
                name: "adminInventory",
                params: {
                    organisationId: nonNullableUser.value.organisationId,
                    propertyId: property.id,
                },
            },
            label: t("Global.manageInventoryLink"),
            isVisible: true,
        };
    }
    // For multiple properties, return an expandable item
    const children = properties.map(function (property) {
        return {
            icon: "home",
            route: {
                name: "adminInventory",
                params: {
                    organisationId: nonNullableUser.value.organisationId,
                    propertyId: property.id,
                },
            },
            label: property.name,
            isVisible: true,
        };
    });
    return {
        icon: "grid",
        label: t("Global.manageInventoryLink"),
        isVisible: true,
        children,
    };
});

const links = computed(function () {
    const role = nonNullableUser.value.role;
    const organisationId = nonNullableUser.value.organisationId;

    const allLinks: (GuardedLink | LinkWithChildren)[] = [
        {
            icon: "home",
            route: { name: "adminOrganisations" },
            label: t("AppDrawer.links.manageOrganisations"),
            isVisible: isAdmin.value,
        },
        {
            icon: "calendar",
            route: { name: "adminEvents", params: { organisationId } },
            label: t("AppDrawer.links.manageEvents"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "users",
            route: { name: "adminUsers", params: { organisationId } },
            label: t("AppDrawer.links.manageUsers"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "arrow-expand",
            route: { name: "adminFloors", params: { organisationId } },
            label: t("AppDrawer.links.manageFloors"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "line-chart",
            route: { name: "adminAnalytics", params: { organisationId } },
            label: t("AppDrawer.links.manageAnalytics"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "cog-wheel",
            route: { name: "adminOrganisationSettings", params: { organisationId } },
            label: t("AppDrawer.links.settings"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "home",
            route: { name: "adminProperties", params: { organisationId } },
            label: t("AppDrawer.links.manageProperties"),
            isVisible: role === Role.PROPERTY_OWNER,
        },
    ];

    const inventory = inventoryLink.value;
    if (inventory) {
        allLinks.push(inventory);
    }

    return allLinks.filter((link) => link.isVisible);
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

function isLinkWithChildren(link: GuardedLink | LinkWithChildren): link is LinkWithChildren {
    return "children" in link;
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

            <!-- Navigation Links -->
            <template v-for="(link, index) in links" :key="index">
                <!-- Expandable Item -->
                <q-expansion-item
                    v-if="isLinkWithChildren(link)"
                    :label="link.label"
                    :icon="link.icon"
                    expand-separator
                >
                    <q-item
                        v-for="(childLink, childIndex) in link.children"
                        :key="childIndex"
                        :to="childLink.route"
                        clickable
                    >
                        <q-item-section avatar>
                            <q-icon :name="childLink.icon" />
                        </q-item-section>
                        <q-item-section>{{ childLink.label }}</q-item-section>
                    </q-item>
                </q-expansion-item>

                <!-- Regular Item -->
                <q-item v-else :to="link.route" clickable>
                    <q-item-section avatar>
                        <q-icon :name="link.icon" />
                    </q-item-section>
                    <q-item-section>{{ link.label }}</q-item-section>
                </q-item>
            </template>

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
