<script setup lang="ts">
import type { CreatePropertyPayload, PropertyDoc, UpdatePropertyPayload } from "@firetable/types";
import type { Link } from "src/types";
import {
    updateProperty,
    createNewProperty,
    deleteProperty,
    getPropertiesPath,
} from "@firetable/backend";

import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTBtn from "src/components/FTBtn.vue";

import { useQuasar } from "quasar";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePropertiesStore } from "src/stores/properties-store";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import { matchesProperty } from "es-toolkit/compat";
import { usePermissionsStore } from "src/stores/permissions-store";
import { useDialog } from "src/composables/useDialog";

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

const organisationsIsLoading = ref(false);

const canCreateProperty = computed(function () {
    const maxAllowedProperties =
        propertiesStore.organisations.find(matchesProperty("id", props.organisationId))
            ?.maxAllowedProperties ?? 0;
    const currentNumOfProperties = properties.value.length;
    return currentNumOfProperties < maxAllowedProperties;
});

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

async function onDeleteProperty(property: PropertyDoc): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await deleteProperty(property);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
        },
    });
}

async function deletePropertyAsync(property: PropertyDoc): Promise<void> {
    if (
        await showConfirm(
            t("PageAdminProperties.deletePropertyDialogTitle"),
            t("PageAdminProperties.deletePropertyDialogMessage"),
        )
    ) {
        return onDeleteProperty(property);
    }
}

async function showUpdatePropertyDialog(property: PropertyDoc): Promise<void> {
    if (await showConfirm("Edit property?")) {
        createProperty(property);
    }
}

function createProperty(property?: PropertyDoc): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: property
                ? t("PageAdminProperties.editPropertyDialogTitle", { name: property.name })
                : t("PageAdminProperties.createPropertyDialogTitle"),
            maximized: false,
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
        },
    });
}

function createLinks(propertyId: string): Link[] {
    const params = { propertyId, organisationId: props.organisationId };
    return [
        {
            label: t("AppDrawer.links.manageEvents"),
            icon: "calendar",
            route: { name: "adminEvents", params },
            visible: permissionStore.canCreateEvents,
        },
        {
            label: t("Global.manageInventoryLink"),
            icon: "grid",
            route: { name: "adminInventory", params },
            visible: permissionStore.canSeeInventory,
        },
        {
            label: t("AppDrawer.links.manageFloors"),
            icon: "arrow-expand",
            route: { name: "adminFloors", params },
            visible: true,
        },
        {
            label: t("AppDrawer.links.manageAnalytics"),
            icon: "line-chart",
            route: { name: "adminAnalytics", params },
            visible: true,
        },
        {
            label: t("AppDrawer.links.manageDrinkCards"),
            icon: "drink",
            route: { name: "adminPropertyDrinkCards", params },
            visible: permissionStore.canSeeInventory,
        },

        {
            label: t("AppDrawer.links.settings"),
            icon: "cog-wheel",
            route: { name: "adminPropertySettings", params },
            visible: true,
        },
    ].filter(function (link) {
        return link.visible;
    });
}
</script>

<template>
    <div>
        <FTTitle :title="t('PageAdminProperties.properties')">
            <template #right>
                <FTBtn
                    v-if="!organisationsIsLoading && canCreateProperty"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createProperty()"
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
                                @click.stop="deletePropertyAsync(property)"
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

        <div v-else-if="!canCreateProperty && !organisationsIsLoading">
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminProperties.maxAmountOfPropertiesReachedMessage") }}
            </h6>
        </div>

        <FTCenteredText v-else-if="properties.length === 0">
            {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
        </FTCenteredText>
    </div>
</template>
