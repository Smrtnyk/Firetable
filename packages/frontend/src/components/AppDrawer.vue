<script setup lang="ts">
import type { GuardedLink, LinkWithChildren } from "src/types";

import { AdminRole, Role } from "@firetable/types";
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
import { useLocale } from "vuetify";

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

const inventoryLink = computed(function () {
    if (isAdmin.value || !canSeeInventory.value) {
        return;
    }

    return buildExpandableLink({
        childIcon: "fa fa-home",
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
        childIcon: "fa fa-home",
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
        childIcon: "fa fa-home",
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
        childIcon: "fa fa-home",
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
        childIcon: "fa fa-home",
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
        propertySettingsLink.value,

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
            return t("AppDrawer.roles.administrator");
        case Role.MANAGER:
            return t("AppDrawer.roles.manager");
        case Role.PROPERTY_OWNER:
            return t("AppDrawer.roles.propertyOwner");
        case Role.STAFF:
            return t("AppDrawer.roles.staff");
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
const { current } = useLocale();
function changeLang(newLang: string): void {
    dynamicallySwitchLang(newLang);
    current.value = newLang;
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
        class="AppDrawer border"
    >
        <!-- Header Section with User Info -->
        <div class="AppDrawer__header">
            <div class="AppDrawer__user-section">
                <v-avatar size="64" class="AppDrawer__avatar">
                    {{ avatar }}
                </v-avatar>
                <div class="AppDrawer__user-info">
                    <div class="AppDrawer__user-name">{{ nonNullableUser.name }}</div>
                    <div class="AppDrawer__user-email">{{ nonNullableUser.email }}</div>
                    <div class="AppDrawer__user-role">
                        <v-icon size="small" class="me-1">fas fa-shield-alt</v-icon>
                        <span>{{ roleDisplayName }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation Section -->
        <div class="AppDrawer__nav">
            <div class="AppDrawer__nav-title">{{ t("AppDrawer.sectionTitles.navigation") }}</div>

            <v-list class="AppDrawer__nav-list">
                <template v-for="(link, index) in links" :key="index">
                    <v-list-group
                        v-if="isLinkWithChildren(link)"
                        class="AppDrawer__nav-item AppDrawer__nav-item--expandable"
                    >
                        <template v-slot:activator="{ props: activatorProps }">
                            <v-list-item
                                v-bind="activatorProps"
                                :title="link.label"
                                :aria-label="link.label"
                                class="AppDrawer__nav-item-activator"
                            >
                                <template v-slot:prepend>
                                    <v-icon :icon="link.icon" size="xs" />
                                </template>
                            </v-list-item>
                        </template>

                        <AppDrawerLink
                            v-for="(childLink, childIndex) in link.children"
                            :link="childLink"
                            :key="childIndex"
                            class="AppDrawer__nav-child"
                        />
                    </v-list-group>

                    <AppDrawerLink :link="link" v-else class="AppDrawer__nav-item" />
                </template>
            </v-list>
        </div>

        <!-- Settings Section -->
        <div class="AppDrawer__settings">
            <div class="AppDrawer__settings-title">{{ t("AppDrawer.sectionTitles.settings") }}</div>

            <!-- Language Selector -->
            <div class="AppDrawer__setting-item">
                <div class="AppDrawer__setting-label">
                    <v-icon size="small" class="me-2">fas fa-globe</v-icon>
                    <span>{{ t("AppDrawer.languageSelectorLabel") }}</span>
                </div>
                <v-select
                    :model-value="lang"
                    :items="langOptions"
                    density="compact"
                    variant="plain"
                    item-title="label"
                    item-value="value"
                    @update:model-value="changeLang"
                    class="AppDrawer__language-select"
                    aria-label="Language switcher"
                    hide-details
                />
            </div>

            <!-- Dark Mode Toggle -->
            <div class="AppDrawer__setting-item">
                <div class="AppDrawer__setting-label">
                    <v-icon size="small" class="me-2">fas fa-moon</v-icon>
                    <span>{{ t("AppDrawer.toggles.darkMode") }}</span>
                </div>
                <v-switch
                    :model-value="isDark"
                    @update:model-value="toggleTheme"
                    color="primary"
                    class="AppDrawer__dark-toggle"
                    aria-label="Toggle Dark Mode"
                    hide-details
                    inset
                />
            </div>
        </div>

        <!-- Footer Section -->
        <div class="AppDrawer__footer">
            <v-btn
                variant="text"
                class="AppDrawer__logout-btn"
                block
                @click="onLogoutUser"
                :aria-label="t('AppDrawer.logoutAriaLabel')"
            >
                <v-icon class="me-2">fas fa-sign-out-alt</v-icon>
                {{ t("AppDrawer.links.logout") }}
            </v-btn>
        </div>
    </v-navigation-drawer>
</template>

<style lang="scss" scoped>
@use "src/css/variables.scss" as *;
@use "sass:color";

.AppDrawer {
    :deep(.v-navigation-drawer__content) {
        background: $page-bg;
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
        :deep(.v-list-item) {
            transition: all 0.2s ease;
            color: $text-secondary;

            &:hover {
                background: $state-hover-light;
                color: $text-primary;
            }
        }

        :deep(.v-list-group__items) {
            padding-left: 16px;
            .v-list-item {
                color: $text-secondary;

                &:hover {
                    background: $state-hover-light;
                    color: $text-primary;
                }
            }
        }

        &--expandable {
            :deep(.v-list-group__header) {
                .v-list-item {
                    color: $text-secondary;

                    &:hover {
                        background: $state-hover-light;
                        color: $text-primary;

                        .v-list-item__prepend .v-icon {
                            color: $accent;
                        }
                    }
                }

                .v-list-item__prepend .v-icon {
                    color: $text-secondary;
                    transition: color 0.2s ease;
                }
            }

            :deep(.v-list-group__header .v-list-item__append .v-icon) {
                font-size: 13px;
                color: $text-tertiary;
                transition:
                    transform 0.2s ease,
                    color 0.2s ease;
            }

            :deep(.v-list-item__title) {
                color: $text-secondary;
            }
        }
    }

    &__nav-child {
        :deep(.v-list-item) {
            margin-left: 8px;
            background: rgba($surface-secondary, 0.8);
            color: $text-secondary;

            &:hover {
                background: $state-hover-light;
                color: $text-primary;

                .v-list-item__prepend .v-icon {
                    color: $accent;
                }
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
        font-size: 14px;
        color: $text-secondary;
    }

    &__language-select {
        min-width: 120px;
        max-width: 120px;

        :deep(.v-field__input) {
            padding: 4px 8px;
        }
    }

    &__dark-toggle {
        :deep(.v-switch__thumb) {
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
.v-theme--dark .AppDrawer {
    :deep(.v-navigation-drawer__content) {
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
        :deep(.v-list-item) {
            color: $text-secondary-dark;

            &:hover {
                background: $state-hover-dark;
                color: $text-primary-dark;
            }
        }

        :deep(.v-list-group__items) {
            .v-list-item {
                color: $text-secondary-dark;

                &:hover {
                    background: $state-hover-dark;
                    color: $text-primary-dark;
                }
            }
        }

        &--expandable {
            :deep(.v-list-group__header) {
                .v-list-item {
                    color: $text-secondary-dark;

                    &:hover {
                        background: $state-hover-dark;
                        color: $text-primary-dark;

                        .v-list-item__prepend .v-icon {
                            color: $accent;
                        }
                    }
                }

                .v-list-item__prepend .v-icon {
                    color: $text-secondary-dark;
                }
            }

            :deep(.v-list-item__title) {
                color: $text-secondary-dark;
            }
        }
    }

    &__nav-child {
        :deep(.v-list-item) {
            background: $role-bg-dark;
            color: $text-secondary-dark;

            &:hover {
                background: $state-hover-dark;
                color: $text-primary-dark;

                .v-list-item__prepend .v-icon {
                    color: $icon-primary-dark;
                }
            }

            .v-list-item__prepend .v-icon {
                color: $icon-secondary-dark;
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
    }

    &__dark-toggle {
        :deep(.v-switch__thumb) {
            color: $icon-primary-dark;
        }
    }

    &__footer {
        background: $surface-primary-dark;
        border-top-color: $border-light-dark;
    }

    &__logout-btn {
        color: color.adjust($negative, $lightness: 10%);

        &:hover {
            background: rgba(color.adjust($negative, $lightness: 10%), 0.2);
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
            :deep(.v-list-item) {
                margin: 0 8px 4px;
                padding: 8px 12px;
            }
        }
    }
}
</style>
