<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";
import type { Link } from "src/types";

import { matchesProperty } from "es-toolkit/compat";
import { useQuasar } from "quasar";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createNewProperty, deleteProperty, getPropertiesPath, updateProperty } from "src/db";
import { showConfirm, showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const authStore = useAuthStore();
const permissionStore = usePermissionsStore();
const propertiesStore = usePropertiesStore();
const quasar = useQuasar();
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
            icon: "calendar",
            label: t("AppDrawer.links.manageEvents"),
            route: { name: "adminEvents", params },
            visible: permissionStore.canCreateEvents,
        },
        {
            icon: "grid",
            label: t("Global.manageInventoryLink"),
            route: { name: "adminInventory", params },
            visible: permissionStore.canSeeInventory,
        },
        {
            icon: "arrow-expand",
            label: t("AppDrawer.links.manageFloors"),
            route: { name: "adminFloors", params },
            visible: true,
        },
        {
            icon: "line-chart",
            label: t("AppDrawer.links.manageAnalytics"),
            route: { name: "adminAnalytics", params },
            visible: true,
        },
        {
            icon: "drink",
            label: t("AppDrawer.links.manageDrinkCards"),
            route: { name: "adminPropertyDrinkCards", params },
            visible: permissionStore.canSeeInventory,
        },

        {
            icon: "cog-wheel",
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
                    icon="plus"
                    class="button-gradient"
                    @click="createVenue()"
                />
            </template>
        </FTTitle>

        <q-list bordered v-if="properties.length > 0" class="rounded-borders">
            <q-expansion-item
                v-for="property in properties"
                :key="property.id"
                expand-icon="arrow_drop_down"
                expand-separator
            >
                <template #header>
                    <q-item-section>
                        <q-item-label>{{ property.name }}</q-item-label>
                    </q-item-section>
                    <q-space />
                    <q-item-section side>
                        <div class="row q-gutter-sm items-center">
                            <FTBtn
                                unelevated
                                icon="pencil"
                                color="positive"
                                @click.stop="showUpdatePropertyDialog(property)"
                            />
                            <FTBtn
                                unelevated
                                icon="trash"
                                color="negative"
                                @click.stop="onDeleteProperty(property)"
                            />
                        </div>
                    </q-item-section>
                </template>

                <!-- Expanded Content -->
                <q-list>
                    <q-item
                        v-for="item in createLinks(property.id)"
                        :key="item.label"
                        clickable
                        :to="item.route"
                    >
                        <q-item-section avatar>
                            <q-icon :name="item.icon" />
                        </q-item-section>
                        <q-item-section>
                            {{ item.label }}
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-expansion-item>
        </q-list>

        <div v-else-if="!canCreateProperty">
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminProperties.maxAmountOfPropertiesReachedMessage") }}
            </h6>
        </div>

        <FTCenteredText v-else-if="properties.length === 0">
            <q-icon name="home" size="64px" color="grey-5" class="q-mb-md" />
            <div class="text-grey-6 q-mb-lg">
                {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
            </div>
            <FTBtn label="Create venue" icon="plus" class="button-gradient" @click="createVenue" />
        </FTCenteredText>
    </div>
</template>
