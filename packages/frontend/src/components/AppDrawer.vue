<script setup lang="ts">
import type { GuardedLink, LinkWithChildren } from "src/types";

import { AdminRole, Role } from "@firetable/types";
import { storeToRefs } from "pinia";
import { Dark, LocalStorage } from "quasar";
import { dynamicallySwitchLang } from "src/boot/i18n";
import AppDrawerLink from "src/components/AppDrawerLink.vue";
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

const lang = ref(locale);
const langOptions = computed(() => [
    { label: t("AppDrawer.languages.english"), value: "en-GB" },
    { label: t("AppDrawer.languages.german"), value: "de" },
    { label: t("AppDrawer.languages.spanish"), value: "es" },
    { label: t("AppDrawer.languages.croatian"), value: "hr" },
]);

const inventoryLink = computed(function () {
    if (isAdmin.value || !canSeeInventory.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "home",
        icon: "fa fa-warehouse",
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
        icon: "fa fa-map",
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
        icon: "fa fa-chart-bar",
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
        icon: "fa fa-calendar",
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
        icon: "fa fa-cocktail",
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
        icon: "fa fa-gears",
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
            icon: "fa fa-home",
            isVisible: isAdmin.value,
            label: t("AppDrawer.links.manageOrganisations"),
            route: { name: "adminOrganisations" },
        },
        {
            icon: "fa fa-bug",
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
            icon: "fa fa-users",
            isVisible: role === Role.PROPERTY_OWNER || role === Role.MANAGER,
            label: t("AppDrawer.links.manageUsers"),
            route: { name: "adminUsers", params: { organisationId } },
        },
        {
            icon: "fa fa-user-friends",
            isVisible: canSeeGuestbook.value && !isAdmin.value,
            label: t("AppDrawer.links.manageGuests"),
            route: { name: "adminGuests", params: { organisationId } },
        },
        {
            icon: "fa fa-building",
            isVisible: role === Role.PROPERTY_OWNER,
            label: t("AppDrawer.links.manageProperties"),
            route: { name: "adminProperties", params: { organisationId } },
        },
        {
            icon: "fa fa-question-circle",
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

const roleDisplayName = computed(function () {
    const role = nonNullableUser.value.role;
    switch (role) {
        case AdminRole.ADMIN:
            return "Administrator";
        case Role.MANAGER:
            return "Manager";
        case Role.PROPERTY_OWNER:
            return "Property Owner";
        case Role.STAFF:
            return "Staff";
        default:
            return role;
    }
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
        class="AppDrawer"
    >
        <!-- Header Section with User Info -->
        <div class="AppDrawer__header">
            <div class="AppDrawer__user-section">
                <q-avatar size="4rem" class="AppDrawer__avatar">
                    {{ avatar }}
                </q-avatar>
                <div class="AppDrawer__user-info">
                    <div class="AppDrawer__user-name">{{ nonNullableUser.name }}</div>
                    <div class="AppDrawer__user-email">{{ nonNullableUser.email }}</div>
                    <div class="AppDrawer__user-role">
                        <i class="fas fa-shield-alt" />
                        <span>{{ roleDisplayName }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation Section -->
        <div class="AppDrawer__nav">
            <div class="AppDrawer__nav-title">Navigation</div>

            <q-list class="AppDrawer__nav-list">
                <template v-for="(link, index) in links" :key="index">
                    <q-expansion-item
                        v-if="isLinkWithChildren(link)"
                        :label="link.label"
                        :icon="link.icon"
                        expand-separator
                        :aria-label="link.label"
                        class="AppDrawer__nav-item AppDrawer__nav-item--expandable"
                    >
                        <AppDrawerLink
                            v-for="(childLink, childIndex) in link.children"
                            :link="childLink"
                            :key="childIndex"
                            class="AppDrawer__nav-child"
                        />
                    </q-expansion-item>

                    <AppDrawerLink :link="link" v-else class="AppDrawer__nav-item" />
                </template>
            </q-list>
        </div>

        <!-- Settings Section -->
        <div class="AppDrawer__settings">
            <div class="AppDrawer__settings-title">Settings</div>

            <!-- Language Selector -->
            <div class="AppDrawer__setting-item">
                <div class="AppDrawer__setting-label">
                    <i class="fas fa-globe" />
                    <span>{{ t("AppDrawer.languageSelectorLabel") }}</span>
                </div>
                <q-select
                    :model-value="lang"
                    :options="langOptions"
                    dense
                    borderless
                    emit-value
                    map-options
                    options-dense
                    @update:model-value="dynamicallySwitchLang"
                    class="AppDrawer__language-select"
                    aria-label="Language switcher"
                />
            </div>

            <!-- Dark Mode Toggle -->
            <div class="AppDrawer__setting-item">
                <div class="AppDrawer__setting-label">
                    <i class="fas fa-moon" />
                    <span>{{ t("AppDrawer.toggles.darkMode") }}</span>
                </div>
                <q-toggle
                    :model-value="Dark.isActive"
                    @update:model-value="setDarkMode"
                    color="primary"
                    size="md"
                    class="AppDrawer__dark-toggle"
                    aria-label="Toggle Dark Mode"
                />
            </div>
        </div>

        <!-- Footer Section -->
        <div class="AppDrawer__footer">
            <q-btn
                flat
                no-caps
                class="AppDrawer__logout-btn full-width"
                @click="onLogoutUser"
                :aria-label="t('AppDrawer.logoutAriaLabel')"
            >
                <q-icon name="fas fa-sign-out-alt" class="q-mr-sm" />
                {{ t("AppDrawer.links.logout") }}
            </q-btn>
        </div>
    </q-drawer>
</template>

<style lang="scss" scoped>
.AppDrawer {
    :deep(.q-drawer__content) {
        background: $page-bg;
        display: flex;
        flex-direction: column;
    }

    &__header {
        background: $header-bg;
        color: white;
        padding: 24px 20px;
        position: relative;
        overflow: hidden;

        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="70" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
            pointer-events: none;
        }
    }

    &__user-section {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 16px;
    }

    &__avatar {
        background: $role-bg-light;
        color: white;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.3);
    }

    &__user-info {
        flex: 1;
    }

    &__user-name {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 2px;
        line-height: 1.2;
    }

    &__user-email {
        font-size: 13px;
        opacity: 0.9;
        margin-bottom: 8px;
    }

    &__user-role {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: $role-bg-light;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        backdrop-filter: blur(10px);

        i {
            font-size: 10px;
        }
    }

    &__profile-btn {
        color: white;
        background: $role-bg-light;
        backdrop-filter: blur(10px);

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }

    &__nav {
        flex: 1;
        padding: 20px 0;
        overflow-y: auto;
    }

    &__nav-title {
        font-size: 14px;
        font-weight: 600;
        color: $text-tertiary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0 20px 12px;
        margin-bottom: 8px;
        border-bottom: 1px solid $border-light;
    }

    &__nav-list {
        padding: 0;
    }

    &__nav-item {
        :deep(.q-item) {
            margin: 0 12px 4px;
            border-radius: 12px;
            transition: all 0.2s ease;

            &:hover {
                background: $state-hover-light;
                transform: translateX(4px);
            }
        }

        :deep(.q-expansion-item__container) {
            .q-item {
                margin: 0 12px 4px;
                border-radius: 12px;
            }
        }

        &--expandable {
            :deep(.q-expansion-item__toggle-icon) {
                color: $icon-primary;
            }
        }
    }

    &__nav-child {
        :deep(.q-item) {
            margin-left: 24px;
            background: rgba($surface-secondary, 0.8);

            &:hover {
                background: $state-hover-light;
            }
        }
    }

    &__settings {
        background: $surface-elevated;
        border-top: 1px solid $border-light;
        padding: 20px;
        margin-top: auto;
    }

    &__settings-title {
        font-size: 14px;
        font-weight: 600;
        color: $text-tertiary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 16px;
    }

    &__setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid $surface-secondary;

        &:last-child {
            border-bottom: none;
        }
    }

    &__setting-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: $text-secondary;
        font-weight: 500;

        i {
            width: 16px;
            color: $icon-primary;
            font-size: 14px;
        }
    }

    &__language-select {
        min-width: 120px;

        :deep(.q-field__control) {
            padding: 4px 8px;
        }
    }

    &__dark-toggle {
        :deep(.q-toggle__inner) {
            color: $icon-primary;
        }
    }

    &__footer {
        background: $surface-primary;
        border-top: 1px solid $border-light;
        padding: 16px 20px;
    }

    &__logout-btn {
        color: $negative;
        font-weight: 500;
        padding: 12px 16px;
        border-radius: 12px;
        transition: all 0.2s ease;

        &:hover {
            background: rgba($negative, 0.1);
        }
    }
}

// Dark mode styles
.body--dark .AppDrawer {
    :deep(.q-drawer__content) {
        background: $page-bg-dark;
    }

    &__header {
        background: $header-bg-dark;
    }

    &__nav-title {
        color: $text-tertiary-dark;
        border-bottom-color: $border-light-dark;
    }

    &__nav-item {
        :deep(.q-item) {
            color: $text-secondary-dark;

            &:hover {
                background: $state-hover-dark;
                color: $text-primary-dark;
            }
        }
    }

    &__nav-child {
        :deep(.q-item) {
            background: $role-bg-dark;

            &:hover {
                background: $state-hover-dark;
            }
        }
    }

    &__settings {
        background: $surface-secondary-dark;
        border-top-color: $border-light-dark;
    }

    &__settings-title {
        color: $text-tertiary-dark;
    }

    &__setting-item {
        border-bottom-color: $border-light-dark;
    }

    &__setting-label {
        color: $text-secondary-dark;

        i {
            color: $icon-primary-dark;
        }
    }

    &__dark-toggle {
        :deep(.q-toggle__inner) {
            color: $icon-primary-dark;
        }
    }

    &__footer {
        background: $surface-primary-dark;
        border-top-color: $border-light-dark;
    }

    &__logout-btn {
        color: lighten($negative, 10%);

        &:hover {
            background: rgba(lighten($negative, 10%), 0.2);
        }
    }
}

// Mobile responsive
@media (max-width: 480px) {
    .AppDrawer {
        &__header {
            padding: 20px 16px;
        }

        &__user-section {
            gap: 12px;
        }

        &__avatar {
            width: 3rem;
            height: 3rem;
        }

        &__user-name {
            font-size: 16px;
        }

        &__user-email {
            font-size: 12px;
        }

        &__settings,
        &__footer {
            padding: 16px;
        }

        &__nav-item {
            :deep(.q-item) {
                margin: 0 8px 4px;
                padding: 8px 12px;
            }
        }
    }
}
</style>
