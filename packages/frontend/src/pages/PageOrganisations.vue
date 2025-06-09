<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { globalDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import { useScreenDetection } from "src/global-reactives/screen-detection";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const { isTablet } = useScreenDetection();
const globalStore = useGlobalStore();
const propertiesStore = usePropertiesStore();
const { organisations } = storeToRefs(usePropertiesStore());

const titleClass = computed(() => (isTablet.value ? "text-h6" : "text-h5"));

function createOrganisation(): void {
    const dialog = globalDialog.openDialog(
        AddNewOrganisationForm,
        {
            onCreate(organisationPayload: CreateOrganisationPayload) {
                onOrganisationCreate(organisationPayload);
                globalDialog.closeDialog(dialog);
            },
        },
        {
            title: t("PageOrganisations.addNewOrganisationTitle"),
        },
    );
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            globalStore.notify(t("PageOrganisations.organisationCreatedSuccess"));
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <v-row v-if="organisations.length > 0" class="ma-0">
        <v-col
            cols="12"
            sm="6"
            class="pa-2"
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
                <v-card class="ft-card">
                    <v-card-text>
                        <v-row align="center" justify="space-between" no-gutters>
                            <h2 :class="[titleClass, 'mb-1 ml-0 mt-0']">
                                {{ organisation.name }}
                            </h2>
                        </v-row>
                    </v-card-text>

                    <v-divider />

                    <v-card-text>
                        <v-row>
                            <v-col cols="5">
                                <v-list-item density="compact" class="pa-0">
                                    <v-list-item-subtitle>
                                        {{ t("PageOrganisations.propertiesLimit") }}
                                    </v-list-item-subtitle>
                                    <v-list-item-title>
                                        {{ organisation.maxAllowedProperties }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-col>
                            <v-col cols="5">
                                <v-list-item density="compact" class="pa-0">
                                    <v-list-item-subtitle>
                                        {{ t("PageOrganisations.floorPlansPerEvent") }}
                                    </v-list-item-subtitle>
                                    <v-list-item-title>
                                        {{
                                            organisation.subscriptionSettings
                                                ?.maxFloorPlansPerEvent ?? "N/A"
                                        }}
                                    </v-list-item-title>
                                </v-list-item>
                            </v-col>

                            <v-col cols="2" class="d-flex align-center justify-end">
                                <v-chip
                                    :color="getOrganisationStatusColor(organisation.status)"
                                    text-color="white"
                                    size="small"
                                    class="ml-1"
                                >
                                    {{ formatOrganisationStatus(organisation.status) }}
                                </v-chip>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </router-link>
        </v-col>
    </v-row>

    <div v-else>
        <FTCenteredText>
            <v-icon icon="fa:fas fa-briefcase" size="64" color="grey-lighten-1" class="mb-4" />
            <div class="text-grey-darken-1 mb-6">
                {{ t("PageOrganisations.noOrganisationsMessage") }}
            </div>
            <FTBtn
                :label="t('PageOrganisations.createOrganisationButton')"
                icon="fa:fas fa-plus"
                class="button-gradient"
                @click="createOrganisation"
            />
        </FTCenteredText>
    </div>
</template>
