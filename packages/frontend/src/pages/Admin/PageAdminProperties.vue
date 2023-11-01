<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewPropertyForm from "components/admin/property/AddNewPropertyForm.vue";

import { Loading, useQuasar } from "quasar";
import { showConfirm, withLoading } from "src/helpers/ui-helpers";
import { createNewProperty, CreatePropertyPayload, deleteProperty } from "@firetable/backend";
import { useProperties } from "src/composables/useProperties";
import { computed, watchEffect } from "vue";
import { useOrganisations } from "src/composables/useOrganisations";
import { useAuthStore } from "stores/auth-store";
import { ADMIN, PropertyDoc } from "@firetable/types";
import { useI18n } from "vue-i18n";
import FTCenteredText from "components/FTCenteredText.vue";

const authStore = useAuthStore();
const quasar = useQuasar();
const { t } = useI18n();
const { properties, fetchProperties, isLoading } = useProperties();
const { organisations, isLoading: organisationsIsLoading } = useOrganisations();

watchEffect(() => {
    if (isLoading.value || organisationsIsLoading.value) {
        Loading.show();
    } else {
        Loading.hide();
    }
});

const canCreateProperty = computed(() => {
    const isAdmin = authStore.user!.role === ADMIN;
    if (isAdmin) {
        return true;
    }
    if (!organisations.value[0]) {
        return false;
    }
    const maxAllowedProperties = organisations.value[0].maxAllowedProperties;
    const currentNumOfProperties = properties.value.length;
    return currentNumOfProperties < maxAllowedProperties;
});

const onPropertyCreate = withLoading(async function (payload: CreatePropertyPayload) {
    await createNewProperty(payload);
    quasar.notify("Property created!");
    return fetchProperties();
});

const onDeleteProperty = withLoading(async (property: PropertyDoc) => {
    await deleteProperty(property);
    return fetchProperties();
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
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: t("PageAdminProperties.createPropertyDialogTitle"),
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
        <FTTitle :title="t('PageAdminProperties.properties')">
            <template #right>
                <q-btn
                    v-if="organisations.length && !organisationsIsLoading && canCreateProperty"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createProperty"
                />
            </template>
        </FTTitle>
        <q-list v-if="properties.length && organisations.length">
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
        <div
            v-if="organisations.length === 0 && !organisationsIsLoading"
            class="row justify-center items-center q-mt-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminProperties.noPropertiesWithoutOrganisationMessage") }}
            </h6>
        </div>

        <div v-else-if="!canCreateProperty && !organisationsIsLoading">
            <h6 class="q-ma-sm text-weight-bolder underline">
                {{ t("PageAdminProperties.maxAmountOfPropertiesReachedMessage") }}
            </h6>
        </div>

        <FTCenteredText v-else-if="properties.length === 0 && !isLoading">
            {{ t("PageAdminProperties.noPropertiesCreatedMessage") }}
        </FTCenteredText>
    </div>
</template>
