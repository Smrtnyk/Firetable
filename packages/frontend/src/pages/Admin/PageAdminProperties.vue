<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewPropertyForm from "components/admin/property/AddNewPropertyForm.vue";

import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { createNewProperty, deleteProperty } from "@firetable/backend";
import { useProperties } from "src/composables/useProperties";

const quasar = useQuasar();
const { properties, fetchProperties } = useProperties();

function onPropertyCreate(propertyName: string) {
    return tryCatchLoadingWrapper({
        hook: async () => {
            await createNewProperty({
                name: propertyName,
            });
            quasar.notify("Property created!");
            void fetchProperties();
        },
    });
}

const onDeleteProperty = loadingWrapper(async (id: string) => {
    await deleteProperty(id);
    await fetchProperties();
});

async function deletePropertyAsync(propertyId: string, reset: () => void): Promise<void> {
    if (await showConfirm("Delete property?")) {
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
            componentPropsObject: {},
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
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createProperty"
                    label="Add new Property"
                />
            </template>
        </FTTitle>
        <q-list v-if="properties">
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
    </div>
</template>
