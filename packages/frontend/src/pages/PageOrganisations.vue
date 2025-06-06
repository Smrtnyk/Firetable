<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import { useDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import { isTablet } from "src/global-reactives/screen-detection";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";

const propertiesStore = usePropertiesStore();
const { organisations } = storeToRefs(usePropertiesStore());
const quasar = useQuasar();

const titleClass = computed(() => (isTablet.value ? "text-h6" : "text-h5"));

const { createDialog } = useDialog();

function createOrganisation(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewOrganisationForm,
            componentPropsObject: {},
            listeners: {
                create(organisationPayload: CreateOrganisationPayload) {
                    onOrganisationCreate(organisationPayload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: "Add new Organisation",
        },
    });
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            quasar.notify({
                message: "Organisation created successfully!",
                type: "success",
            });
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <div class="PageOrganisations">
        <div class="row" v-if="organisations.length > 0">
            <div
                class="col-12 col-sm-6 q-pa-sm"
                v-for="organisation of organisations"
                :key="organisation.id"
            >
                <router-link
                    :to="{
                        name: 'properties',
                        params: { organisationId: organisation.id },
                    }"
                    class="text-decoration-none"
                >
                    <q-card class="ft-card">
                        <q-card-section>
                            <div class="row items-center justify-between">
                                <h2 :class="[titleClass, 'q-mb-sm q-ml-none q-mt-none']">
                                    {{ organisation.name }}
                                </h2>
                            </div>
                        </q-card-section>

                        <q-separator />

                        <q-card-section>
                            <div class="row q-col-gutter-sm">
                                <div class="col-5">
                                    <q-item dense>
                                        <q-item-section>
                                            <q-item-label caption>Properties Limit</q-item-label>
                                            <q-item-label>{{
                                                organisation.maxAllowedProperties
                                            }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </div>
                                <div class="col-5">
                                    <q-item dense>
                                        <q-item-section>
                                            <q-item-label caption>Floor Plans/Event</q-item-label>
                                            <q-item-label>{{
                                                organisation.subscriptionSettings
                                                    ?.maxFloorPlansPerEvent ?? "N/A"
                                            }}</q-item-label>
                                        </q-item-section>
                                    </q-item>
                                </div>

                                <div class="col-2">
                                    <q-chip
                                        :color="getOrganisationStatusColor(organisation.status)"
                                        text-color="white"
                                        size="sm"
                                        class="q-ml-sm"
                                    >
                                        {{ formatOrganisationStatus(organisation.status) }}
                                    </q-chip>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </router-link>
            </div>
        </div>

        <div v-else>
            <FTCenteredText>
                <q-icon name="crown" size="64px" color="grey-5" class="q-mb-md" />
                <div class="text-grey-6 q-mb-lg">Create your first organisation to get started</div>
                <FTBtn
                    label="Create Organisation"
                    icon="plus"
                    class="button-gradient"
                    @click="createOrganisation"
                />
            </FTCenteredText>
        </div>
    </div>
</template>
