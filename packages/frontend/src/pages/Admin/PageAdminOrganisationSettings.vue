<script setup lang="ts">
import type { OrganisationSettings, PropertySettings } from "@firetable/types";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, ref } from "vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { updateOrganisationSettings, updatePropertySettings } from "@firetable/backend";

import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
import FTTitle from "src/components/FTTitle.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";
import { timezones } from "src/helpers/date-utils";

export interface PageAdminOrganisationSettingsProps {
    organisationId: string;
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
] as const;

const props = defineProps<PageAdminOrganisationSettingsProps>();
const propertiesStore = usePropertiesStore();
const properties = computed(() =>
    propertiesStore.getPropertiesByOrganisationId(props.organisationId),
);

const organisationSettings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

type EditableSettings = {
    organisation: OrganisationSettings;
    properties: Record<string, PropertySettings>;
};
const editableSettings = ref<EditableSettings>({
    organisation: JSON.parse(JSON.stringify(organisationSettings.value)),
    properties: {},
});

const aspectRatioOptions = ["1", "16:9"];

const hasSettingsChanged = computed(() => {
    // Check if organisation settings changed
    const organisationChanged =
        JSON.stringify(editableSettings.value.organisation) !==
        JSON.stringify(organisationSettings.value);

    // Check if any property settings changed
    const propertiesChanged = properties.value.some((property) => {
        const currentSettings = propertiesStore.getPropertySettingsById(property.id);
        const editedSettings = editableSettings.value.properties[property.id];
        return JSON.stringify(currentSettings) !== JSON.stringify(editedSettings);
    });

    return organisationChanged || propertiesChanged;
});

function reset(): void {
    editableSettings.value.organisation = JSON.parse(JSON.stringify(organisationSettings.value));
    initPropertySettings();
}

function initPropertySettings(): void {
    properties.value.forEach((property) => {
        const propertySettings = propertiesStore.getPropertySettingsById(property.id);

        editableSettings.value.properties[property.id] = {
            timezone: propertySettings.timezone,
        };
    });
}

async function saveSettings(): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const savePromises: Promise<void>[] = [];

            // Check if organisation settings changed and need to be saved
            const organisationChanged =
                JSON.stringify(editableSettings.value.organisation) !==
                JSON.stringify(organisationSettings.value);

            if (organisationChanged) {
                savePromises.push(
                    updateOrganisationSettings(
                        props.organisationId,
                        editableSettings.value.organisation,
                    ),
                );
            }

            // Check which properties had their settings changed
            properties.value.forEach(function (property) {
                const currentSettings = propertiesStore.getPropertySettingsById(property.id);
                const editedSettings = editableSettings.value.properties[property.id];

                if (JSON.stringify(currentSettings) !== JSON.stringify(editedSettings)) {
                    savePromises.push(
                        updatePropertySettings(props.organisationId, property.id, editedSettings),
                    );
                }
            });

            // Wait for all updates to complete
            await Promise.all(savePromises);
        },
    });
}

onMounted(initPropertySettings);
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
                    v-model="editableSettings.organisation.property.propertyCardAspectRatio"
                    :options="aspectRatioOptions"
                />
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Event">
            <SettingsSection title="Default event start time">
                <q-input
                    :model-value="editableSettings.organisation.event.eventStartTime24HFormat"
                    rounded
                    standout
                    readonly
                >
                    <template #append>
                        <q-icon name="clock" class="cursor-pointer" />
                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                            <q-time
                                v-model="
                                    editableSettings.organisation.event.eventStartTime24HFormat
                                "
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
                    label="Event duration in hours"
                    v-model.number="editableSettings.organisation.event.eventDurationInHours"
                />
            </SettingsSection>

            <SettingsSection title="Event card aspect ratio">
                <q-select
                    rounded
                    standout
                    v-model="editableSettings.organisation.event.eventCardAspectRatio"
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
                        'background-color': editableSettings.organisation.event[colorSetting.key],
                    }"
                    icon="color-picker"
                    push
                    :label="editableSettings.organisation.event[colorSetting.key]"
                    stack
                >
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="editableSettings.organisation.event[colorSetting.key]" />
                    </q-popup-proxy>
                </q-btn>
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Guest">
            <SettingsSection title="Collect guest data">
                <q-toggle
                    v-model="editableSettings.organisation.guest.collectGuestData"
                    :label="editableSettings.organisation.guest.collectGuestData ? 'On' : 'Off'"
                />
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Properties">
            <div v-for="property in properties" :key="property.id">
                <SettingsSection
                    :title="property.name"
                    v-if="editableSettings.properties[property.id]"
                >
                    <q-select
                        rounded
                        standout
                        v-model="editableSettings.properties[property.id].timezone"
                        :options="timezones"
                        label="Timezone"
                    />
                </SettingsSection>
            </div>
        </AppCardSection>
    </div>
</template>
