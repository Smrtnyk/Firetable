<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewPropertyForm from "components/admin/property/AddNewPropertyForm.vue";

import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { documentId, where } from "firebase/firestore";
import { PropertyDoc } from "@firetable/types";
import { useAuthStore } from "stores/auth-store";
import { createNewProperty, deleteProperty, propertiesCollection } from "@firetable/backend";
import { computed, ref, watchEffect } from "vue";
import { takeProp } from "@firetable/utils";

const authStore = useAuthStore();
const quasar = useQuasar();
const propertyIds = computed(() => {
    return authStore.userPropertyMap.map(takeProp("propertyId"));
});
const properties = ref<PropertyDoc[]>([]);

watchEffect(async () => {
    if (propertyIds.value.length) {
        const res = useFirestoreCollection<PropertyDoc>(
            createQuery(propertiesCollection(), where(documentId(), "in", propertyIds.value)),
        );
        await res.promise.value;
        properties.value = res.data.value;
    }
});

function onPropertyCreate(propertyName: string) {
    return tryCatchLoadingWrapper({
        hook: async () => {
            await createNewProperty({
                name: propertyName,
            });
            quasar.notify("Property created!");
        },
    });
}

const onDeleteProperty = loadingWrapper((id: string) => {
    return deleteProperty(id);
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
