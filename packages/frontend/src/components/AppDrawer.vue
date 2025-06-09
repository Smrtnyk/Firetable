<script setup lang="ts">
import type { GuardedLink, LinkWithChildren } from "src/types";

import { Role } from "@firetable/types";
import { storeToRefs } from "pinia";
import { dynamicallySwitchLang } from "src/boot/i18n";
import AppDrawerLink from "src/components/AppDrawerLink.vue";
import { useAppTheme } from "src/composables/useAppTheme";
import { logoutUser } from "src/db";
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
const { isDark, toggleTheme } = useAppTheme();
const lang = ref(locale);
const langOptions = computed(() => [
    { label: t("AppDrawer.languages.english"), value: "en-GB" },
    { label: t("AppDrawer.languages.german"), value: "de" },
    { label: t("AppDrawer.languages.spanish"), value: "es" },
    { label: t("AppDrawer.languages.croatian"), value: "hr" },
]);

function faIcon(iconName: string): string {
    return `fa:fas ${iconName.startsWith("fa-") ? iconName : `fa-${iconName}`}`;
}

const inventoryLink = computed(function () {
    if (isAdmin.value || !canSeeInventory.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: faIcon("home"),
        icon: faIcon("warehouse"),
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
        childIcon: faIcon("home"),
        icon: faIcon("map"),
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
        icon: faIcon("chart-bar"),
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
        childIcon: faIcon("home"),
        icon: faIcon("calendar"),
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
        childIcon: faIcon("home"),
        icon: faIcon("cocktail"),
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
        childIcon: faIcon("home"),
        icon: faIcon("gears"),
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
            icon: faIcon("home"),
            isVisible: isAdmin.value,
            label: t("AppDrawer.links.manageOrganisations"),
            route: { name: "adminOrganisations" },
        },
        {
            icon: faIcon("bug"),
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
            icon: faIcon("users"),
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
            label: t("AppDrawer.links.manageUsers"),
            route: { name: "adminUsers", params: { organisationId } },
        },
        {
            icon: faIcon("user-friends"),
            isVisible: canSeeGuestbook.value && !isAdmin.value,
            label: t("AppDrawer.links.manageGuests"),
            route: { name: "adminGuests", params: { organisationId } },
        },
        {
            icon: faIcon("building"),
            isVisible: role === Role.PROPERTY_OWNER,
            label: t("AppDrawer.links.manageProperties"),
            route: { name: "adminProperties", params: { organisationId } },
        },
        {
            icon: faIcon("question-circle"),
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
        return first[0].toUpperCase();
    }
    return `${first[0]}${last[0]}`.toUpperCase();
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

    const children = properties.map(function (property) {
        return {
            icon: childIcon ?? faIcon("home"),
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

function handleDrawerUpdate(value: boolean): void {
    emit("update:modelValue", value);
}

function isLinkWithChildren(link: GuardedLink | LinkWithChildren): link is LinkWithChildren {
    return "children" in link;
}

async function onLogoutUser(): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            emit("update:modelValue", false);
            return logoutUser();
        },
    });
}
</script>

<template>
    <v-navigation-drawer
        temporary
        :model-value="props.modelValue"
        @update:model-value="handleDrawerUpdate"
        location="right"
        width="300"
        class="border"
    >
        <v-list nav>
            <v-list-item class="d-flex flex-column align-center pt-10 pb-6 text-center">
                <v-avatar size="96" color="primary" class="ft-avatar mb-4">
                    <span class="text-h4">{{ avatar }}</span>
                </v-avatar>
                <v-list-item-title class="text-subtitle-1">{{
                    nonNullableUser.name
                }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey">{{
                    nonNullableUser.email
                }}</v-list-item-subtitle>
            </v-list-item>

            <v-divider v-if="links.length > 0" class="my-2" />

            <template v-for="(link, index) in links" :key="index">
                <v-list-group v-if="isLinkWithChildren(link)" :value="link.label">
                    <template #activator="{ props: activatorProps }">
                        <v-list-item
                            v-bind="activatorProps"
                            :prepend-icon="link.icon"
                            :title="link.label"
                            :aria-label="link.label"
                        />
                    </template>
                    <AppDrawerLink
                        v-for="(childLink, childIndex) in link.children"
                        :link="childLink"
                        :key="childIndex"
                        is-child
                    />
                </v-list-group>

                <AppDrawerLink :link="link" v-else />
            </template>

            <v-divider class="my-2" />

            <v-list-item @click="onLogoutUser" :aria-label="t('AppDrawer.logoutAriaLabel')" link>
                <template #prepend>
                    <v-icon :icon="faIcon('sign-out')" />
                </template>
                <v-list-item-title>{{ t("AppDrawer.links.logout") }}</v-list-item-title>
            </v-list-item>

            <v-divider class="my-2" />
            <v-list-item>
                <v-select
                    class="w-100"
                    :model-value="lang"
                    :items="langOptions"
                    :label="t('AppDrawer.languageSelectorLabel')"
                    density="compact"
                    variant="outlined"
                    item-title="label"
                    item-value="value"
                    hide-details
                    @update:model-value="dynamicallySwitchLang"
                />
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item>
                <v-switch
                    :model-value="isDark"
                    @update:model-value="toggleTheme"
                    :true-icon="faIcon('moon')"
                    :false-icon="faIcon('sun')"
                    color="primary"
                    inset
                    :label="t('AppDrawer.toggles.darkMode')"
                    hide-details
                />
            </v-list-item>
        </v-list>
    </v-navigation-drawer>
</template>
