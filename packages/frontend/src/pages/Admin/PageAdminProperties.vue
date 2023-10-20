<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewPropertyForm from "components/admin/property/AddNewPropertyForm.vue";

import { Loading, useQuasar } from "quasar";
import { showConfirm, withLoading } from "src/helpers/ui-helpers";
import { createNewProperty, CreatePropertyPayload, deleteProperty } from "@firetable/backend";
import { useProperties } from "src/composables/useProperties";
import { watchEffect } from "vue";
import { useOrganisations } from "src/composables/useOrganisations";

const quasar = useQuasar();
const { properties, fetchProperties, isLoading } = useProperties();
const { organisations, isLoading: organisationsIsLoading } = useOrganisations();

watchEffect(() => {
    if (isLoading.value || organisationsIsLoading.value) {
        Loading.show();
    } else {
        Loading.hide();
    }
});

const onPropertyCreate = withLoading(async function (payload: CreatePropertyPayload) {
    await createNewProperty(payload);
    quasar.notify("Property created!");
    return fetchProperties();
});

const onDeleteProperty = withLoading(async (id: string) => {
    await deleteProperty(id);
    return fetchProperties();
});

async function deletePropertyAsync(propertyId: string, reset: () => void): Promise<void> {
    if (await showConfirm("Delete property?", "This will also delete all the associated events!")) {
        return onDeleteProperty(propertyId);
    }
    reset();
}

function createProperty(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Property",
            maximized: false,
            component: AddNewPropertyForm,
            componentPropsObject: {
                organisations: organisations.value,
            },
            listeners: {
                create: onPropertyCreate,
            },
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Properties">
            <template #right>
                <q-btn
                    v-if="organisations.length && !organisationsIsLoading"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createProperty"
                    label="Add new Property"
                />
            </template>
        </FTTitle>
        <q-list v-if="properties.length && organisations.length">
            <q-slide-item
                v-for="property in properties"
                :key="property.id"
                right-color="warning"
                @right="({ reset }) => deletePropertyAsync(property.id, reset)"
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
        <div
            v-if="properties.length === 0 && !isLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">There are no properties created.</h6>
        </div>

        <div
            v-if="organisations.length === 0 && !organisationsIsLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                In order to create properties, you must first create an organisation.
            </h6>
        </div>
    </div>
</template>
