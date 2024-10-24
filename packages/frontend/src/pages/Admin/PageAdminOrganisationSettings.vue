<script setup lang="ts">
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { updateOrganisationSettings } from "@firetable/backend";

import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
import FTTitle from "src/components/FTTitle.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const propertiesStore = usePropertiesStore();
const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const editableSettings = ref(JSON.parse(JSON.stringify(settings.value)));

const aspectRatioOptions = ["1", "16:9"];

const hasSettingsChanged = computed(function () {
    return JSON.stringify(editableSettings.value) !== JSON.stringify(settings.value);
});

async function saveSettings(): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return updateOrganisationSettings(props.organisationId, editableSettings.value);
        },
    });
}

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
    {
        title: "Reservation waiting for response color",
        key: "reservationWaitingForResponseColor",
    },
];

function reset(): void {
    editableSettings.value = JSON.parse(JSON.stringify(settings.value));
}
</script>

<template>
    <div class="PageAdminOrganisationSettings">
        <FTTitle title="Settings">
            <template #right>
                <FTBtn
                    rounded
                    class="button-gradient q-mr-sm"
                    :disable="!hasSettingsChanged"
                    @click="saveSettings"
                >
                    Save
                </FTBtn>
                <FTBtn
                    rounded
                    class="button-gradient"
                    :disable="!hasSettingsChanged"
                    @click="reset"
                >
                    Reset
                </FTBtn>
            </template>
        </FTTitle>

        <AppCardSection title="Property">
            <SettingsSection title="Property card aspect ratio">
                <q-select
                    rounded
                    standout
                    v-model="editableSettings.property.propertyCardAspectRatio"
                    :options="aspectRatioOptions"
                />
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Event">
            <SettingsSection title="Default event start time">
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
                    stretch
                    :title="colorSetting.title"
                    :style="{
                        'background-color': editableSettings.event[colorSetting.key],
                    }"
                    icon="color-picker"
                    push
                    :label="editableSettings.event[colorSetting.key]"
                    stack
                >
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="editableSettings.event[colorSetting.key]" />
                    </q-popup-proxy>
                </q-btn>
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Guest">
            <SettingsSection title="Collect guest data">
                <q-toggle
                    v-model="editableSettings.guest.collectGuestData"
                    :label="editableSettings.guest.collectGuestData ? 'On' : 'Off'"
                />
            </SettingsSection>
        </AppCardSection>
    </div>
</template>
