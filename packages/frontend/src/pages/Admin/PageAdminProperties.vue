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
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const { isMobile } = useScreenDetection();
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
                globalDialog.closeDialog(dialog);
            },
            onUpdate(payload: UpdatePropertyPayload) {
                onPropertyUpdate(payload);
                globalDialog.closeDialog(dialog);
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
    <div>
        <FTTitle :title="t('PageAdminProperties.properties')">
            <template #right>
                <FTBtn
                    v-if="properties.length > 0 && canCreateProperty"
                    rounded="pill"
                    icon="fa:fas fa-plus"
                    class="button-gradient"
                    variant="elevated"
                    density="comfortable"
                    @click="createVenue()"
                    :aria-label="t('PageAdminProperties.createPropertyButtonLabel')"
                />
            </template>
        </FTTitle>

        <!-- Properties Grid -->
        <div class="properties-grid mt-6" v-if="properties.length > 0">
            <FTCard v-for="property in properties" :key="property.id" class="property-card">
                <!-- Card Header -->
                <v-card-text class="card-header pa-0">
                    <div class="header-content">
                        <v-avatar
                            :color="isDark ? 'primary' : 'primary'"
                            size="40"
                            class="property-avatar"
                        >
                            <v-icon icon="fa:fas fa-home" size="24" color="white" />
                        </v-avatar>
                        <div class="property-info">
                            <h6 class="property-name text-h6 my-0">
                                {{ property.name }}
                            </h6>
                            <div class="text-caption text-grey-darken-1">
                                {{ t("PageAdminProperties.venueIdLabel") }}
                                {{ property.id.slice(0, 8) }}...
                            </div>
                        </div>
                        <v-spacer v-if="!isMobile" />
                        <div class="action-buttons">
                            <v-btn
                                variant="text"
                                size="small"
                                icon="fa:fas fa-pencil"
                                color="success"
                                @click.stop="showUpdatePropertyDialog(property)"
                            >
                                <v-tooltip activator="parent" location="top">
                                    {{ t("Global.edit") }}
                                </v-tooltip>
                            </v-btn>
                            <v-btn
                                variant="text"
                                size="small"
                                icon="fa:fas fa-trash"
                                color="error"
                                @click.stop="onDeleteProperty(property)"
                            >
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
                                :text-color="isDark ? 'white' : 'grey-darken-2'"
                                size="56"
                            >
                                <v-icon :icon="link.icon" size="24" />
                            </v-avatar>
                            <div class="link-label text-caption text-center mt-1">
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
            <v-icon icon="fa:fas fa-home" size="64" color="grey-lighten-1" class="mb-4" />
            <div class="text-grey-darken-1 mb-6">
                {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
            </div>
            <FTBtn
                prepend-icon="fa:fas fa-plus"
                class="button-gradient"
                variant="elevated"
                @click="() => createVenue()"
            >
                {{ t("PageAdminProperties.createVenueButtonLabel") }}
            </FTBtn>
        </FTCenteredText>
    </div>
</template>

<style scoped lang="scss">
.properties-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;

    @media (max-width: 599px) {
        // Vuetify xs breakpoint
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

.property-card {
    .card-header {
        .header-content {
            padding: 16px; // Adjusted padding for v-card-text
            display: flex;
            align-items: center;
            gap: 16px;

            .property-avatar {
                flex-shrink: 0;
            }

            .property-info {
                flex: 1;
                min-width: 0; // Prevents overflow with long names
                // width: 100%; // Usually not needed with flex: 1

                .property-name {
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .action-buttons {
                display: flex;
                gap: 4px;
            }
        }
    }

    .links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 16px;
        justify-items: center; // Center items in grid cells

        .link-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
            width: 100px;

            &:hover {
                background-color: rgba(var(--v-theme-primary-rgb), 0.1);
                transform: translateY(-2px);
            }

            .link-label {
                max-width: 100%;
                word-break: break-word;
                line-height: 1.2;
                margin-top: 4px;
            }
        }
    }
}
</style>
