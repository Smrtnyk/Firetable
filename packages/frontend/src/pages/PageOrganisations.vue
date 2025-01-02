<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";
import { OrganisationStatus } from "@firetable/types";
import { isTablet } from "src/global-reactives/screen-detection";
import { computed } from "vue";

const { organisations } = storeToRefs(usePropertiesStore());

const titleClass = computed(() => (isTablet.value ? "text-h6" : "text-h5"));

function getStatusColor(status?: OrganisationStatus): string {
    switch (status) {
        case OrganisationStatus.ACTIVE:
            return "positive";
        case OrganisationStatus.DISABLED:
            return "grey";
        case OrganisationStatus.PENDING:
            return "warning";
        case OrganisationStatus.SUSPENDED:
            return "negative";
        default:
            return "grey";
    }
}

function formatStatus(status?: OrganisationStatus): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "No Status";
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
                                        :color="getStatusColor(organisation.status)"
                                        text-color="white"
                                        size="sm"
                                        class="q-ml-sm"
                                    >
                                        {{ formatStatus(organisation.status) }}
                                    </q-chip>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </router-link>
            </div>
        </div>

        <FTCenteredText v-else>No Organisations have been created</FTCenteredText>
    </div>
</template>
