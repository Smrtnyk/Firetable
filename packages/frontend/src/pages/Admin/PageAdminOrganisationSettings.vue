<script setup lang="ts">
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { withLoading } from "src/helpers/ui-helpers";
import { updateOrganisationSettings } from "@firetable/backend";

import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
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

const saveSettings = withLoading(() => {
    return updateOrganisationSettings(props.organisationId, editableSettings.value);
});

const colorsSettings = [
    {
        title: "Reservation pending color",
        key: "reservationPendingColor",
    },
    {
        title: "Reservation arrived color",
        key: "reservationArrivedColor",
    },
    {
        title: "Reservation confirmed color",
        key: "reservationConfirmedColor",
    },
    {
        title: "Reservation cancelled color",
        key: "reservationCancelledColor",
    },
];
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

            <SettingsSection title="Property card aspect ratio">
                <q-select
                    rounded
                    standout
                    v-model="editableSettings.property.propertyCardAspectRatio"
                    :options="aspectRatioOptions"
                />
            </SettingsSection>
        </q-card>

        <q-card class="ft-card q-pa-md q-mb-md">
            <FTCenteredText>Event</FTCenteredText>

            <div class="column q-col-gutter-md">
                <SettingsSection title="Event start date">
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
                </SettingsSection>

                <SettingsSection title="Event duration in hours">
                    <q-input
                        rounded
                        standout
                        v-model.number="editableSettings.event.eventDurationInHours"
                    />
                </SettingsSection>

                <SettingsSection title="Event card aspect ratio">
                    <q-select
                        rounded
                        standout
                        v-model="editableSettings.event.eventCardAspectRatio"
                        :options="aspectRatioOptions"
                    />
                </SettingsSection>

                <SettingsSection
                    v-for="colorSetting in colorsSettings"
                    :key="colorSetting.key"
                    :title="colorSetting.title"
                >
                    <q-btn
                        class="full-width"
                        :title="colorSetting.title"
                        :style="{
                            'background-color': editableSettings.event[colorSetting.key],
                        }"
                    >
                        <q-icon name="color-picker" class="cursor-pointer q-ma-none" />
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-color v-model="editableSettings.event[colorSetting.key]" />
                        </q-popup-proxy>
                    </q-btn>
                </SettingsSection>
            </div>
        </q-card>
    </div>
</template>
