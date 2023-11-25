<script setup lang="ts">
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";

import { Loading, useQuasar } from "quasar";
import { showConfirm, withLoading } from "src/helpers/ui-helpers";
import {
    createNewProperty,
    CreatePropertyPayload,
    deleteProperty,
    getPropertiesPath,
} from "@firetable/backend";
import { computed, onMounted, ref, watchEffect } from "vue";
import { PropertyDoc } from "@firetable/types";
import { useI18n } from "vue-i18n";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import { useRoute } from "vue-router";
import { useFirestoreCollection } from "src/composables/useFirestore";

const route = useRoute();
const propertiesStore = usePropertiesStore();
const quasar = useQuasar();
const { t } = useI18n();

const organisationId = computed(() => {
    return route.params.organisationId as string;
});
const { data: properties } = useFirestoreCollection<PropertyDoc>(
    getPropertiesPath(organisationId.value),
);

const organisationsIsLoading = ref(false);

const canCreateProperty = computed(() => {
    const maxAllowedProperties =
        propertiesStore.organisations.find((organisation) => {
            return organisation.id === organisationId.value;
        })?.maxAllowedProperties || 0;
    const currentNumOfProperties = properties.value.length;
    return currentNumOfProperties < maxAllowedProperties;
});

onMounted(async () => {
    organisationsIsLoading.value = true;
    try {
        await propertiesStore.getOrganisations(organisationId.value);
    } catch (error) {
        console.error("Failed to load organizations:", error);
    } finally {
        organisationsIsLoading.value = false;
    }
});

watchEffect(() => {
    if (organisationsIsLoading.value) {
        Loading.show();
    } else {
        Loading.hide();
    }
});

const onPropertyCreate = withLoading(async function (payload: CreatePropertyPayload) {
    await createNewProperty(payload);
    quasar.notify("Property created!");
});

const onDeleteProperty = withLoading(async (property: PropertyDoc) => {
    await deleteProperty(property);
});

async function deletePropertyAsync(property: PropertyDoc, reset: () => void): Promise<void> {
    if (
        await showConfirm(
            t("PageAdminProperties.deletePropertyDialogTitle"),
            t("PageAdminProperties.deletePropertyDialogMessage"),
        )
    ) {
        return onDeleteProperty(property);
    }
    reset();
}

function createProperty(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminProperties.createPropertyDialogTitle"),
            maximized: false,
            component: AddNewPropertyForm,
            componentPropsObject: {
                organisationId: organisationId.value,
            },
            listeners: {
                create: (payload: CreatePropertyPayload) => {
                    onPropertyCreate(payload);
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
                    @click="createProperty"
                />
            </template>
        </FTTitle>

        <q-list v-if="properties.length > 0">
            <q-slide-item
                v-for="property in properties"
                :key="property.id"
                right-color="warning"
                @right="({ reset }) => deletePropertyAsync(property, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
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
