<script setup lang="ts">
import type { CreatePropertyPayload, UpdatePropertyPayload } from "@firetable/backend";
import type { PropertyDoc, VoidFunction } from "@firetable/types";
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

import { useQuasar } from "quasar";
import { showConfirm, withLoading } from "src/helpers/ui-helpers";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePropertiesStore } from "src/stores/properties-store";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import { matchesProperty } from "es-toolkit/compat";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();

const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const quasar = useQuasar();
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

const onPropertyCreate = withLoading(async function (payload: CreatePropertyPayload) {
    await createNewProperty(payload);
    if (authStore.isAdmin) {
        await propertiesStore.initAdminProperties();
    }
    quasar.notify("Property created!");
});

const onPropertyUpdate = withLoading(async function (payload: UpdatePropertyPayload) {
    await updateProperty(payload);
    if (authStore.isAdmin) {
        await propertiesStore.initAdminProperties();
    }
    quasar.notify("Property updated!");
});

const onDeleteProperty = withLoading(async function (property: PropertyDoc) {
    await deleteProperty(property);
    if (authStore.isAdmin) {
        await propertiesStore.initAdminProperties();
    }
});

async function deletePropertyAsync(property: PropertyDoc, reset: VoidFunction): Promise<void> {
    reset();
    if (
        await showConfirm(
            t("PageAdminProperties.deletePropertyDialogTitle"),
            t("PageAdminProperties.deletePropertyDialogMessage"),
        )
    ) {
        return onDeleteProperty(property);
    }
}

function showUpdatePropertyDialog(property: PropertyDoc, reset: VoidFunction): void {
    reset();
    createProperty(property);
}

function createProperty(property?: PropertyDoc): void {
    const dialog = quasar.dialog({
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
</script>

<template>
    <div>
        <FTTitle :title="t('PageAdminProperties.properties')">
            <template #right>
                <q-btn
                    v-if="!organisationsIsLoading && canCreateProperty"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="() => createProperty()"
                />
            </template>
        </FTTitle>

        <q-list v-if="properties.length > 0">
            <q-slide-item
                v-for="property in properties"
                :key="property.id"
                right-color="warning"
                @right="({ reset }) => deletePropertyAsync(property, reset)"
                @left="({ reset }) => showUpdatePropertyDialog(property, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <template #left>
                    <q-icon name="pencil" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label> {{ property.name }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
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
