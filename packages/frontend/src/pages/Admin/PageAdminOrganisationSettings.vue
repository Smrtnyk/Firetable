<script setup lang="ts">
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";

import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const propertiesStore = usePropertiesStore();
const settings = computed(() => {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const editableSettings = ref(JSON.parse(JSON.stringify(settings.value)));

const aspectRatioOptions = ["1", "16:9"];

const hasSettingsChanged = computed(() => {
    return JSON.stringify(editableSettings.value) !== JSON.stringify(settings.value);
});

function saveSettings(): void {
    try {
        console.log(hasSettingsChanged.value);
    } catch (error) {
        // Handle error
    }
}
</script>

<template>
    <div class="PageAdminOrganisationSettings">
        <FTTitle title="Settings">
            <template #right>
                <q-btn
                    rounded
                    class="button-gradient"
                    :disable="!hasSettingsChanged"
                    :loading="false"
                    @click="saveSettings"
                >
                    Save
                </q-btn>
            </template>
        </FTTitle>

        <q-card class="ft-card q-pa-md q-mb-md">
            <FTCenteredText>Property</FTCenteredText>

            <div class="row">
                <div class="col-10">Property card aspect ratio</div>

                <div class="col-2">
                    <q-select
                        rounded
                        standout
                        v-model="editableSettings.property.propertyCardAspectRatio"
                        :options="aspectRatioOptions"
                    />
                </div>
            </div>
        </q-card>

        <q-card class="ft-card q-pa-md q-mb-md">
            <FTCenteredText>Event</FTCenteredText>

            <div class="column q-col-gutter-md">
                <div class="row">
                    <div class="col-10">Event start time</div>

                    <div class="col-2">
                        <q-input
                            :model-value="editableSettings.event.eventStartTime24HFormat"
                            rounded
                            standout
                            readonly
                        >
                            <template #append>
                                <q-icon name="clock" class="cursor-pointer" />
                                <q-popup-proxy transition-show="scale" transition-hide="scale">
                                    <q-time
                                        v-model="editableSettings.event.eventStartTime24HFormat"
                                        format="24h"
                                    />
                                </q-popup-proxy>
                            </template>
                        </q-input>
                    </div>
                </div>

                <div class="row">
                    <div class="col-10">Event duration in hours</div>

                    <div class="col-2">
                        <q-input
                            rounded
                            standout
                            v-model.number="editableSettings.event.eventDurationInHours"
                        />
                    </div>
                </div>

                <div class="row">
                    <div class="col-10">Event card aspect ratio</div>

                    <div class="col-2">
                        <q-select
                            rounded
                            standout
                            v-model="editableSettings.event.eventCardAspectRatio"
                            :options="aspectRatioOptions"
                        />
                    </div>
                </div>
            </div>
        </q-card>
    </div>
</template>
