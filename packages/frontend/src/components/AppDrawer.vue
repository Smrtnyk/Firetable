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
import AppDrawerLink from "src/components/AppDrawerLink.vue";
import { dynamicallySwitchLang } from "src/config";
import { usePermissionsStore } from "src/stores/permissions-store";

export interface AppDrawerProps {
    modelValue: boolean;
}
const { nonNullableUser, isAdmin } = storeToRefs(useAuthStore());
const {
    canSeeInventory,
    canEditFloorPlans,
    canCreateEvents,
    canSeeGuestbook,
    canSeeAnalytics,
    canSeeDigitalDrinkCards,
} = storeToRefs(usePermissionsStore());
const propertiesStore = usePropertiesStore();
const props = defineProps<AppDrawerProps>();
const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>();
const { t, locale } = useI18n();

const lang = ref(locale);
const langOptions = [
    { value: "en-GB", label: "English" },
    { value: "de", label: "German" },
];

const inventoryLink = computed(function () {
    if (isAdmin.value || !canSeeInventory.value) {
        return;
    }

    return buildExpandableLink({
        label: t("Global.manageInventoryLink"),
        icon: "grid",
        routeName: "adminInventory",
        isVisible: true,
        childIcon: "home",
    });
});

const manageFloorsLink = computed(function () {
    if (isAdmin.value || !canEditFloorPlans.value) {
        return;
    }

    return buildExpandableLink({
        label: t("AppDrawer.links.manageFloors"),
        icon: "arrow-expand",
        routeName: "adminFloors",
        isVisible: true,
        childIcon: "home",
    });
});

const manageAnalyticsLink = computed(function () {
    if (isAdmin.value || !canSeeAnalytics.value) {
        return;
    }

    return buildExpandableLink({
        icon: "line-chart",
        routeName: "adminAnalytics",
        label: t("AppDrawer.links.manageAnalytics"),
        isVisible: true,
    });
});

const manageEventsLink = computed(function () {
    if (isAdmin.value || !canCreateEvents.value) {
        return;
    }

    return buildExpandableLink({
        label: t("AppDrawer.links.manageEvents"),
        icon: "calendar",
        routeName: "adminEvents",
        isVisible: true,
        childIcon: "home",
    });
});

const digitalDrinkCardsLink = computed(function () {
    if (isAdmin.value || !canSeeDigitalDrinkCards.value) {
        return;
    }

    return buildExpandableLink({
        label: t("AppDrawer.links.manageDrinkCards"),
        icon: "drink",
        routeName: "adminPropertyDrinkCards",
        isVisible: true,
        childIcon: "home",
    });
});

const propertySettingsLink = computed(function () {
    if (isAdmin.value) {
        return;
    }
    const role = nonNullableUser.value.role;

    return buildExpandableLink({
        label: t("AppDrawer.links.settings"),
        icon: "cog-wheel",
        routeName: "adminPropertySettings",
        isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        childIcon: "home",
    });
});

const links = computed<(GuardedLink | LinkWithChildren)[]>(function () {
    const role = nonNullableUser.value.role;
    const organisationId = nonNullableUser.value.organisationId;

    const allLinks: (GuardedLink | LinkWithChildren | undefined)[] = [
        {
            icon: "home",
            route: { name: "adminOrganisations" },
            label: t("AppDrawer.links.manageOrganisations"),
            isVisible: isAdmin.value,
        },
        {
            icon: "bug",
            route: { name: "adminIssueReports" },
            label: t("AppDrawer.links.issueReportsOverview"),
            isVisible: isAdmin.value,
        },
        manageEventsLink.value,
        manageFloorsLink.value,
        digitalDrinkCardsLink.value,
        inventoryLink.value,
        manageAnalyticsLink.value,
        {
            icon: "users",
            route: { name: "adminUsers", params: { organisationId } },
            label: t("AppDrawer.links.manageUsers"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
        },
        {
            icon: "users-list",
            route: { name: "adminGuests", params: { organisationId } },
            label: t("AppDrawer.links.manageGuests"),
            isVisible: canSeeGuestbook.value && !isAdmin.value,
        },
        {
            icon: "home",
            route: { name: "adminProperties", params: { organisationId } },
            label: t("AppDrawer.links.manageProperties"),
            isVisible: role === Role.PROPERTY_OWNER,
        },
        {
            icon: "bug",
            route: { name: "reportIssue", params: { organisationId } },
            label: t("AppDrawer.links.reportIssue"),
            isVisible: !isAdmin.value,
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
    label: string;
    icon: string;
    routeName: string;
    isVisible: boolean;
    childIcon?: string;
}): GuardedLink | LinkWithChildren | undefined {
    const { label, icon, routeName, isVisible, childIcon } = options;

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
            route: toRoute(property.id),
            label,
            isVisible,
        };
    }

    // For multiple properties, return an expandable item
    const children = properties.map(function (property) {
        return {
            icon: childIcon ?? "home",
            route: toRoute(property.id),
            label: property.name,
            isVisible: true,
        };
    });

    return {
        icon,
        label,
        isVisible,
        children,
    };
}

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
    dynamicallySwitchLang(val);
}

function isLinkWithChildren(link: GuardedLink | LinkWithChildren): link is LinkWithChildren {
    return "children" in link;
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
