<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";

const { organisations } = storeToRefs(usePropertiesStore());
</script>

<template>
    <div class="PageOrganisations">
        <div class="row q-col-gutter-sm" v-if="organisations.length > 0">
            <div
                class="col-12 col-sm-6 q-pa-xs"
                v-for="organisation of organisations"
                :key="organisation.id"
            >
                <router-link
                    :to="{
                        name: 'properties',
                        params: {
                            organisationId: organisation.id,
                        },
                    }"
                >
                    <q-card class="ft-card">
                        <q-card-section>
                            <h2 class="text-h3 q-mb-sm q-ml-none q-mt-none">
                                {{ organisation.name }}
                            </h2>
                        </q-card-section>
                    </q-card>
                </router-link>
            </div>
        </div>

        <FTCenteredText v-else>No Organisations have been created</FTCenteredText>
    </div>
</template>
