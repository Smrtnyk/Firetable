<script setup lang="ts">
import type { GuardedLink, LinkWithChildren } from "src/types";

import { logoutUser } from "@firetable/backend";
import { Role } from "@firetable/types";
import { storeToRefs } from "pinia";
import { Dark, LocalStorage } from "quasar";
import { dynamicallySwitchLang } from "src/boot/i18n";
import AppDrawerLink from "src/components/AppDrawerLink.vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

export interface AppDrawerProps {
    modelValue: boolean;
}
const { isAdmin, nonNullableUser } = storeToRefs(useAuthStore());
const {
    canCreateEvents,
    canEditFloorPlans,
    canSeeAnalytics,
    canSeeDigitalDrinkCards,
    canSeeGuestbook,
    canSeeInventory,
} = storeToRefs(usePermissionsStore());
const propertiesStore = usePropertiesStore();
const props = defineProps<AppDrawerProps>();
const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>();
const { locale, t } = useI18n();

const lang = ref(locale);
const langOptions = [
    { label: "English", value: "en-GB" },
    { label: "German", value: "de" },
    { label: "Spanish", value: "es" },
    { label: "Croatian", value: "hr" },
];

const inventoryLink = computed(function () {
    if (isAdmin.value || !canSeeInventory.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "home",
        icon: "grid",
        isVisible: true,
        label: t("Global.manageInventoryLink"),
        routeName: "adminInventory",
    });
});

const manageFloorsLink = computed(function () {
    if (isAdmin.value || !canEditFloorPlans.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "home",
        icon: "arrow-expand",
        isVisible: true,
        label: t("AppDrawer.links.manageFloors"),
        routeName: "adminFloors",
    });
});

const manageAnalyticsLink = computed(function () {
    if (isAdmin.value || !canSeeAnalytics.value) {
        return;
    }

    return buildExpandableLink({
        icon: "line-chart",
        isVisible: true,
        label: t("AppDrawer.links.manageAnalytics"),
        routeName: "adminAnalytics",
    });
});

const manageEventsLink = computed(function () {
    if (isAdmin.value || !canCreateEvents.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "home",
        icon: "calendar",
        isVisible: true,
        label: t("AppDrawer.links.manageEvents"),
        routeName: "adminEvents",
    });
});

const digitalDrinkCardsLink = computed(function () {
    if (isAdmin.value || !canSeeDigitalDrinkCards.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "home",
        icon: "drink",
        isVisible: true,
        label: t("AppDrawer.links.manageDrinkCards"),
        routeName: "adminPropertyDrinkCards",
    });
});

const propertySettingsLink = computed(function () {
    if (isAdmin.value) {
        return;
    }
    const role = nonNullableUser.value.role;

    return buildExpandableLink({
        childIcon: "home",
        icon: "cog-wheel",
        isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        label: t("AppDrawer.links.settings"),
        routeName: "adminPropertySettings",
    });
});

const links = computed<(GuardedLink | LinkWithChildren)[]>(function () {
    const role = nonNullableUser.value.role;
    const organisationId = nonNullableUser.value.organisationId;

    const allLinks: (GuardedLink | LinkWithChildren | undefined)[] = [
        {
            icon: "home",
            isVisible: isAdmin.value,
            label: t("AppDrawer.links.manageOrganisations"),
            route: { name: "adminOrganisations" },
        },
        {
            icon: "bug",
            isVisible: isAdmin.value,
            label: t("AppDrawer.links.issueReportsOverview"),
            route: { name: "adminIssueReports" },
        },
        manageEventsLink.value,
        manageFloorsLink.value,
        digitalDrinkCardsLink.value,
        inventoryLink.value,
        manageAnalyticsLink.value,
        {
            icon: "users",
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
            label: t("AppDrawer.links.manageUsers"),
            route: { name: "adminUsers", params: { organisationId } },
        },
        {
            icon: "users-list",
            isVisible: canSeeGuestbook.value && !isAdmin.value,
            label: t("AppDrawer.links.manageGuests"),
            route: { name: "adminGuests", params: { organisationId } },
        },
        {
            icon: "home",
            isVisible: role === Role.PROPERTY_OWNER,
            label: t("AppDrawer.links.manageProperties"),
            route: { name: "adminProperties", params: { organisationId } },
        },
        {
            icon: "bug",
            isVisible: !isAdmin.value,
            label: t("AppDrawer.links.reportIssue"),
            route: { name: "reportIssue", params: { organisationId } },
        },
        propertySettingsLink.value,
    ];

    return allLinks.filter(function (link): link is NonNullable<GuardedLink | LinkWithChildren> {
        return link !== undefined && link.isVisible;
    });
});

const avatar = computed(function () {
    const [first, last] = nonNullableUser.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

function buildExpandableLink(options: {
    childIcon?: string;
    icon: string;
    isVisible: boolean;
    label: string;
    routeName: string;
}): GuardedLink | LinkWithChildren | undefined {
    const { childIcon, icon, isVisible, label, routeName } = options;

    if (!isVisible) {
        return;
    }

    const properties = propertiesStore.getPropertiesByOrganisationId(
        nonNullableUser.value.organisationId,
    );

    if (properties.length === 0) {
        return;
    }

    function toRoute(propertyId: string): GuardedLink["route"] {
        return {
            name: routeName,
            params: {
                organisationId: nonNullableUser.value.organisationId,
                propertyId,
            },
        };
    }

    if (properties.length === 1) {
        const property = properties[0];
        return {
            icon,
            isVisible,
            label,
            route: toRoute(property.id),
        };
    }

    // For multiple properties, return an expandable item
    const children = properties.map(function (property) {
        return {
            icon: childIcon ?? "home",
            isVisible: true,
            label: property.name,
            route: toRoute(property.id),
        };
    });

    return {
        children,
        icon,
        isVisible,
        label,
    };
}

function isLinkWithChildren(link: GuardedLink | LinkWithChildren): link is LinkWithChildren {
    return "children" in link;
}

async function onLogoutUser(): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return logoutUser();
        },
    });
}

function setDarkMode(newValue: boolean): void {
    Dark.set(newValue);
    LocalStorage.set("FTDarkMode", newValue);
}
</script>

<template>
    <q-drawer
        no-swipe-open
        :model-value="props.modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        side="right"
        behavior="mobile"
        bordered
    >
        <q-list>
            <q-item class="column items-center q-pt-xl q-pb-lg">
                <q-avatar size="6rem" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
                <div class="q-mt-md text-center">
                    <div class="text-subtitle1">{{ nonNullableUser.name }}</div>
                    <div class="text-caption text-grey">{{ nonNullableUser.email }}</div>
                </div>
            </q-item>

            <q-separator v-if="links.length > 0" />

            <template v-for="(link, index) in links" :key="index">
                <q-expansion-item
                    v-if="isLinkWithChildren(link)"
                    :label="link.label"
                    :icon="link.icon"
                    expand-separator
                    :aria-label="link.label"
                    expand-icon="arrow_drop_down"
                >
                    <AppDrawerLink
                        v-for="(childLink, childIndex) in link.children"
                        :link="childLink"
                        :key="childIndex"
                    />
                </q-expansion-item>

                <AppDrawerLink :link="link" v-else />
            </template>

            <q-separator spaced />

            <q-item clickable @click="onLogoutUser" aria-label="Logout">
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
                    :label="t('AppDrawer.languageSelectorLabel')"
                    dense
                    borderless
                    emit-value
                    map-options
                    options-dense
                    @update:model-value="dynamicallySwitchLang"
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
