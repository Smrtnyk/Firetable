<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";
import type { Link } from "src/types";

import { matchesProperty } from "es-toolkit/compat";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCard from "src/components/FTCard.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useAppTheme } from "src/composables/useAppTheme";
import { globalDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createNewProperty, deleteProperty, getPropertiesPath, updateProperty } from "src/db";
import { showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const permissionStore = usePermissionsStore();
const propertiesStore = usePropertiesStore();
const globalStore = useGlobalStore();
const router = useRouter();
const { t } = useI18n();
const { isDark } = useAppTheme();
const { data: properties } = useFirestoreCollection<PropertyDoc>(
    getPropertiesPath(props.organisationId),
);

const canCreateProperty = computed(function () {
    const maxAllowedProperties =
        propertiesStore.organisations.find(matchesProperty("id", props.organisationId))
            ?.maxAllowedProperties ?? 0;
    const currentNumOfProperties = properties.value.length;
    return currentNumOfProperties < maxAllowedProperties;
});

function createLinks(propertyId: string): Link[] {
    const params = { organisationId: props.organisationId, propertyId };
    return [
        {
            icon: formatIcon("fa fa-calendar"),
            label: t("AppDrawer.links.manageEvents"),
            route: { name: "adminEvents", params },
            visible: permissionStore.canCreateEvents,
        },
        {
            icon: formatIcon("fa fa-warehouse"),
            label: t("Global.manageInventoryLink"),
            route: { name: "adminInventory", params },
            visible: permissionStore.canSeeInventory,
        },
        {
            icon: formatIcon("fa fa-map"),
            label: t("AppDrawer.links.manageFloors"),
            route: { name: "adminFloors", params },
            visible: true,
        },
        {
            icon: formatIcon("fa fa-chart-bar"),
            label: t("AppDrawer.links.manageAnalytics"),
            route: { name: "adminAnalytics", params },
            visible: true,
        },
        {
            icon: formatIcon("fa fa-cocktail"),
            label: t("AppDrawer.links.manageDrinkCards"),
            route: { name: "adminPropertyDrinkCards", params },
            visible: permissionStore.canSeeInventory,
        },
        {
            icon: formatIcon("fa fa-gear"),
            label: t("AppDrawer.links.settings"),
            route: { name: "adminPropertySettings", params },
            visible: true,
        },
    ].filter(function (link) {
        return link.visible;
    });
}

function createVenue(property?: PropertyDoc): void {
    const dialog = globalDialog.openDialog(
        AddNewPropertyForm,
        {
            onCreate(payload: CreatePropertyPayload) {
                onPropertyCreate(payload);
                dialog.hide();
            },
            onUpdate(payload: UpdatePropertyPayload) {
                onPropertyUpdate(payload);
                dialog.hide();
            },
            organisationId: props.organisationId,
            propertyDoc: property,
        },
        {
            title: property
                ? t("PageAdminProperties.editPropertyDialogTitle", { name: property.name })
                : t("PageAdminProperties.createPropertyDialogTitle"),
        },
    );
}

function formatIcon(iconName: string): string {
    if (iconName.startsWith("fa ")) {
        return `fa:fas ${iconName.slice(3)}`;
    }
    return iconName;
}

function navigateToLink(route: any): void {
    router.push(route);
}

async function onDeleteProperty(property: PropertyDoc): Promise<void> {
    const shouldDelete = await showDeleteConfirm(
        t("PageAdminProperties.deletePropertyDialogTitle"),
        t("PageAdminProperties.deletePropertyDialogMessage"),
        property.name,
    );

    if (!shouldDelete) return;

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteProperty(property);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
            globalStore.notify(t("PageAdminProperties.propertyDeletedSuccess"), "success");
        },
    });
}

async function onPropertyCreate(payload: CreatePropertyPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewProperty(payload);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
            globalStore.notify(t("PageAdminProperties.propertyCreatedSuccess"), "success");
        },
    });
}

async function onPropertyUpdate(payload: UpdatePropertyPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await updateProperty(payload);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
            globalStore.notify(t("PageAdminProperties.propertyUpdatedSuccess"), "success");
        },
    });
}

async function showUpdatePropertyDialog(property: PropertyDoc): Promise<void> {
    // Assuming globalDialog.confirm is compatible or adapted
    if (
        await globalDialog.confirm({
            message: t("PageAdminProperties.editPropertyConfirmMessage", { name: property.name }),
            title: t("PageAdminProperties.editPropertyDialogTitle", { name: property.name }),
        })
    ) {
        createVenue(property);
    }
}
</script>

<template>
    <div class="PageAdminProperties">
        <FTTitle :title="t('PageAdminProperties.properties')">
            <template #right>
                <FTBtn
                    v-if="properties.length > 0 && canCreateProperty"
                    icon="fas fa-plus"
                    :title="t('PageAdminProperties.createPropertyButtonLabel')"
                    color="primary"
                    @click="createVenue()"
                />
            </template>
        </FTTitle>

        <!-- Properties Grid -->
        <div class="properties-grid mt-6" v-if="properties.length > 0">
            <FTCard v-for="property in properties" :key="property.id" class="property-card">
                <!-- Card Header -->
                <v-card-text class="pa-4">
                    <div class="header-content">
                        <v-avatar color="primary" size="40" class="property-avatar">
                            <v-icon icon="fas fa-home" size="20" color="white" />
                        </v-avatar>
                        <div class="property-info">
                            <h6 class="property-name text-subtitle-1 mb-1">
                                {{ property.name }}
                            </h6>
                            <div class="text-caption text-grey-darken-1">
                                {{ t("PageAdminProperties.venueIdLabel") }}
                                {{ property.id.slice(0, 8) }}...
                            </div>
                        </div>
                        <div class="action-buttons ml-auto">
                            <v-btn
                                variant="text"
                                size="small"
                                color="success"
                                @click.stop="showUpdatePropertyDialog(property)"
                            >
                                <v-icon>fas fa-pencil</v-icon>
                                <v-tooltip activator="parent" location="top">
                                    {{ t("Global.edit") }}
                                </v-tooltip>
                            </v-btn>
                            <v-btn
                                variant="text"
                                size="small"
                                color="error"
                                @click.stop="onDeleteProperty(property)"
                            >
                                <v-icon>fas fa-trash</v-icon>
                                <v-tooltip activator="parent" location="top">
                                    {{ t("Global.delete") }}
                                </v-tooltip>
                            </v-btn>
                        </div>
                    </div>
                </v-card-text>

                <v-divider />

                <!-- Quick Links Grid -->
                <v-card-text class="pa-4">
                    <div class="links-grid">
                        <div
                            v-for="link in createLinks(property.id)"
                            :key="link.label"
                            class="link-item"
                            @click="navigateToLink(link.route)"
                            role="button"
                            tabindex="0"
                            @keydown.enter="navigateToLink(link.route)"
                        >
                            <v-avatar
                                :color="isDark ? 'grey-darken-3' : 'grey-lighten-4'"
                                size="48"
                                class="mb-2"
                            >
                                <v-icon :icon="link.icon" size="20" />
                            </v-avatar>
                            <div class="link-label text-caption text-center">
                                {{ link.label }}
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </FTCard>
        </div>

        <!-- Max Properties Reached -->
        <div v-else-if="!canCreateProperty && properties.length > 0" class="mt-4 text-center">
            <h6 class="ma-1 font-weight-bold text-decoration-underline">
                {{ t("PageAdminProperties.maxAmountOfPropertiesReachedMessage") }}
            </h6>
        </div>

        <!-- Empty State -->
        <FTCenteredText v-else-if="properties.length === 0" class="mt-10">
            <v-icon icon="fas fa-home" size="64" color="grey-lighten-1" class="mb-4" />
            <div class="text-grey-darken-1 mb-6">
                {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
            </div>
            <FTBtn
                prepend-icon="fas fa-plus"
                :title="t('PageAdminProperties.createVenueButtonLabel')"
                color="primary"
                @click="createVenue()"
            >
                {{ t("PageAdminProperties.createVenueButtonLabel") }}
            </FTBtn>
        </FTCenteredText>
    </div>
</template>

<style scoped lang="scss">
.PageAdminProperties {
    .properties-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;

        .property-card {
            width: 100%;
            max-width: 100%;
            overflow: hidden;

            .header-content {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;

                .property-avatar {
                    flex-shrink: 0;
                }

                .property-info {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;

                    .property-name {
                        font-weight: 600;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        margin: 0;
                    }
                }

                .action-buttons {
                    display: flex;
                    gap: 4px;
                    flex-shrink: 0;
                }
            }

            .links-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr); // Always 3 columns
                grid-template-rows: repeat(2, 1fr); // Always 2 rows
                gap: 12px;
                justify-items: center;

                // Responsive gap adjustments
                @media (max-width: 768px) {
                    gap: 8px;
                }

                @media (max-width: 480px) {
                    gap: 6px;
                }

                .link-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    width: 100%;

                    // Responsive padding
                    @media (max-width: 768px) {
                        padding: 6px;
                    }

                    @media (max-width: 480px) {
                        padding: 4px;
                    }

                    &:hover {
                        background-color: rgba(var(--v-theme-primary), 0.1);
                        transform: translateY(-2px);
                    }

                    .v-avatar {
                        margin-bottom: 8px;

                        // Responsive avatar sizes
                        @media (max-width: 480px) {
                            --v-avatar-height: 36px !important;
                            --v-avatar-width: 36px !important;
                        }
                    }

                    .link-label {
                        line-height: 1.2;
                        word-break: break-word;
                        hyphens: auto;
                        font-size: 11px;

                        // Responsive font sizes
                        @media (max-width: 768px) {
                            font-size: 10px;
                        }

                        @media (max-width: 480px) {
                            font-size: 9px;
                        }
                    }
                }
            }
        }
    }

    // Mobile responsive fixes
    @media (max-width: 768px) {
        .properties-grid {
            grid-template-columns: 1fr;
            gap: 16px;
        }

        .property-card {
            .header-content {
                gap: 8px;

                .action-buttons {
                    flex-direction: row;
                    gap: 2px;
                }
            }
        }
    }

    // Extra small mobile
    @media (max-width: 480px) {
        .property-card {
            .header-content {
                .property-info {
                    .property-name {
                        font-size: 14px;
                    }
                }

                .action-buttons {
                    .v-btn {
                        min-width: 32px;
                        width: 32px;
                        height: 32px;
                    }
                }
            }
        }
    }
}
</style>
