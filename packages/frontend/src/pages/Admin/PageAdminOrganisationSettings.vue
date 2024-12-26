<script setup lang="ts">
import type { OrganisationSettings, PropertySettings } from "@firetable/types";
import { updateOrganisationSettings, updatePropertySettings } from "../../backend-proxy";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted, ref } from "vue";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useDialog } from "src/composables/useDialog";
import { useHasChanged } from "src/composables/useHasChanged";

import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
import FTDialogTimezoneSelector from "src/components/FTDialogTimezoneSelector.vue";
import FTTitle from "src/components/FTTitle.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTBottomDialog from "src/components/FTBottomDialog.vue";
import { cloneDeep, isEqual } from "es-toolkit";

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
const { createDialog } = useDialog();

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
    organisation: cloneDeep(organisationSettings.value),
    properties: {},
});

const { hasChanged: organisationHasChanged, reset: resetOrganisationChangedTracking } =
    useHasChanged(computed(() => editableSettings.value.organisation));

const { hasChanged: propertiesHaveChanged, reset: resetPropertiesChangedTracking } = useHasChanged(
    computed(() => editableSettings.value.properties),
);

const hasChanged = computed(() => organisationHasChanged.value || propertiesHaveChanged.value);

const aspectRatioOptions = ["1", "16:9"];

function reset(): void {
    editableSettings.value.organisation = cloneDeep(organisationSettings.value);
    resetOrganisationChangedTracking();

    initPropertySettings();
}

function initPropertySettings(): void {
    properties.value.forEach(function (property) {
        const propertySettings = propertiesStore.getPropertySettingsById(property.id);

        editableSettings.value.properties[property.id] = {
            timezone: propertySettings.timezone,
            markGuestAsLateAfterMinutes: propertySettings.markGuestAsLateAfterMinutes,
        };
    });

    resetPropertiesChangedTracking();
}

async function synchroniseNewOrganisationSettings(): Promise<void> {
    await updateOrganisationSettings(props.organisationId, editableSettings.value.organisation);
    propertiesStore.setOrganisationSettings(
        props.organisationId,
        editableSettings.value.organisation,
    );
}

async function synchroniseNewPropertySettings(propertyId: string): Promise<void> {
    await updatePropertySettings(
        props.organisationId,
        propertyId,
        editableSettings.value.properties[propertyId],
    );
    propertiesStore.setPropertySettings(propertyId, editableSettings.value.properties[propertyId]);
}

async function saveSettings(): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            const savePromises: Promise<void>[] = [];

            // Check if organisation settings changed and need to be saved
            if (organisationHasChanged.value) {
                savePromises.push(synchroniseNewOrganisationSettings());
            }

            // Check which properties had their settings changed
            properties.value.forEach(function (property) {
                const currentSettings = propertiesStore.getPropertySettingsById(property.id);
                const editedSettings = editableSettings.value.properties[property.id];

                if (!isEqual(currentSettings, editedSettings)) {
                    savePromises.push(synchroniseNewPropertySettings(property.id));
                }
            });

            await Promise.all(savePromises);

            resetOrganisationChangedTracking();
            resetPropertiesChangedTracking();
        },
    });
}

function openTimezoneSelector(propertyId: string): void {
    const dialog = createDialog({
        component: FTBottomDialog,
        componentProps: {
            component: FTDialogTimezoneSelector,
            listeners: {
                timezoneSelected(timezone: string) {
                    dialog.hide();
                    editableSettings.value.properties[propertyId].timezone = timezone;
                },
            },
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
                    :disable="!hasChanged"
                    @click="saveSettings"
                >
                    Save
                </FTBtn>
                <FTBtn rounded class="button-gradient" :disable="!hasChanged" @click="reset">
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

        <AppCardSection
            :aria-label="property.name + ' settings card'"
            v-for="property in properties"
            :key="property.id"
            :title="property.name"
        >
            <SettingsSection title="Timezone" v-if="editableSettings.properties[property.id]">
                <q-input
                    rounded
                    standout
                    readonly
                    v-model="editableSettings.properties[property.id].timezone"
                    @click="openTimezoneSelector(property.id)"
                    label="Property timezone"
                />
            </SettingsSection>

            <SettingsSection
                title="Guest late criteria"
                v-if="editableSettings.properties[property.id]"
            >
                <q-input
                    rounded
                    standout
                    type="number"
                    min="1"
                    label="In minutes"
                    hint="Set to 0 to disable"
                    v-model="editableSettings.properties[property.id].markGuestAsLateAfterMinutes"
                />
            </SettingsSection>
        </AppCardSection>
    </div>
</template>
