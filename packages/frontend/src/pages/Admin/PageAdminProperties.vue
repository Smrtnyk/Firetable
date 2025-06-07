<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";
import type { Link } from "src/types";

import { matchesProperty } from "es-toolkit/compat";
import { useQuasar } from "quasar";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCard from "src/components/FTCard.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createNewProperty, deleteProperty, getPropertiesPath, updateProperty } from "src/db";
import { isDark } from "src/global-reactives/is-dark";
import { isMobile } from "src/global-reactives/screen-detection";
import { showConfirm, showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
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
const quasar = useQuasar();
const router = useRouter();
const { createDialog } = useDialog();
const { t } = useI18n();
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
            icon: "fa fa-calendar",
            label: t("AppDrawer.links.manageEvents"),
            route: { name: "adminEvents", params },
            visible: permissionStore.canCreateEvents,
        },
        {
            icon: "fa fa-warehouse",
            label: t("Global.manageInventoryLink"),
            route: { name: "adminInventory", params },
            visible: permissionStore.canSeeInventory,
        },
        {
            icon: "fa fa-map",
            label: t("AppDrawer.links.manageFloors"),
            route: { name: "adminFloors", params },
            visible: true,
        },
        {
            icon: "fa fa-chart-bar",
            label: t("AppDrawer.links.manageAnalytics"),
            route: { name: "adminAnalytics", params },
            visible: true,
        },
        {
            icon: "fa fa-cocktail",
            label: t("AppDrawer.links.manageDrinkCards"),
            route: { name: "adminPropertyDrinkCards", params },
            visible: permissionStore.canSeeInventory,
        },

        {
            icon: "fa fa-gear",
            label: t("AppDrawer.links.settings"),
            route: { name: "adminPropertySettings", params },
            visible: true,
        },
    ].filter(function (link) {
        return link.visible;
    });
}

function createVenue(property?: PropertyDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewPropertyForm,
            componentPropsObject: {
                organisationId: props.organisationId,
                propertyDoc: property,
            },
            listeners: {
                create(payload: CreatePropertyPayload) {
                    onPropertyCreate(payload);
                    dialog.hide();
                },
                update(payload: UpdatePropertyPayload) {
                    onPropertyUpdate(payload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: property
                ? t("PageAdminProperties.editPropertyDialogTitle", { name: property.name })
                : t("PageAdminProperties.createPropertyDialogTitle"),
        },
    });
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
            quasar.notify("Property created!");
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
            quasar.notify("Property updated!");
        },
    });
}

async function showUpdatePropertyDialog(property: PropertyDoc): Promise<void> {
    if (await showConfirm("Edit property?")) {
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
                    rounded
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="createVenue()"
                />
            </template>
        </FTTitle>

        <!-- Properties Grid -->
        <div class="properties-grid" v-if="properties.length > 0">
            <FTCard v-for="property in properties" :key="property.id" class="property-card">
                <!-- Card Header -->
                <q-card-section class="card-header q-pa-none">
                    <div class="header-content">
                        <q-avatar
                            :color="isDark ? 'primary' : 'primary'"
                            text-color="white"
                            class="property-avatar"
                        >
                            <q-icon name="fa fa-home" size="28px" />
                        </q-avatar>
                        <div class="property-info">
                            <h6 class="property-name text-h6 q-my-none">
                                {{ property.name }}
                            </h6>
                            <div class="text-caption text-grey">
                                Venue ID: {{ property.id.slice(0, 8) }}...
                            </div>
                        </div>
                        <q-space v-if="!isMobile" />
                        <div class="action-buttons">
                            <q-btn
                                flat
                                round
                                size="sm"
                                icon="fa fa-pencil"
                                color="positive"
                                @click.stop="showUpdatePropertyDialog(property)"
                            >
                                <q-tooltip>{{ t("Global.edit") }}</q-tooltip>
                            </q-btn>
                            <q-btn
                                flat
                                round
                                size="sm"
                                icon="fa fa-trash"
                                color="negative"
                                @click.stop="onDeleteProperty(property)"
                            >
                                <q-tooltip>{{ t("Global.delete") }}</q-tooltip>
                            </q-btn>
                        </div>
                    </div>
                </q-card-section>

                <q-separator />

                <!-- Quick Links Grid -->
                <q-card-section class="q-pa-md">
                    <div class="links-grid">
                        <div
                            v-for="link in createLinks(property.id)"
                            :key="link.label"
                            class="link-item"
                            @click="navigateToLink(link.route)"
                        >
                            <q-avatar
                                :color="isDark ? 'grey-9' : 'grey-2'"
                                :text-color="isDark ? 'white' : 'grey-8'"
                                size="56px"
                            >
                                <q-icon :name="link.icon" size="24px" />
                            </q-avatar>
                            <div class="link-label text-caption text-center q-mt-sm">
                                {{ link.label }}
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </FTCard>
        </div>

        <!-- Max Properties Reached -->
        <div v-else-if="!canCreateProperty && properties.length > 0">
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminProperties.maxAmountOfPropertiesReachedMessage") }}
            </h6>
        </div>

        <!-- Empty State -->
        <FTCenteredText v-else-if="properties.length === 0">
            <q-icon name="fa fa-home" size="64px" color="grey-5" class="q-mb-md" />
            <div class="text-grey-6 q-mb-lg">
                {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
            </div>
            <FTBtn
                label="Create venue"
                icon="fa fa-plus"
                class="button-gradient"
                @click="createVenue"
            />
        </FTCenteredText>
    </div>
</template>

<style scoped lang="scss">
.properties-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
}

.property-card {
    .card-header {
        .header-content {
            padding: 8px;
            display: flex;
            align-items: center;
            gap: 16px;

            .property-avatar {
                flex-shrink: 0;
            }

            .property-info {
                flex: 1;
                min-width: 0;
                width: 100%;

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

        .link-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;

            &:hover {
                background-color: rgba(var(--q-primary-rgb), 0.1);
                transform: translateY(-2px);
            }

            .link-label {
                max-width: 80px;
                word-break: break-word;
                line-height: 1.2;
            }
        }
    }
}
</style>
