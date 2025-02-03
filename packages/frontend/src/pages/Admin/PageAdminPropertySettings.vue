<script setup lang="ts">
import { cloneDeep } from "es-toolkit";
import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBottomDialog from "src/components/FTBottomDialog.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTTimezoneList from "src/components/FTTimezoneList.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { useHasChanged } from "src/composables/useHasChanged";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";

import { updatePropertySettings } from "../../backend-proxy";

export interface PageAdminPropertySettingsProps {
    organisationId: string;
    propertyId: string;
}

const colorsSettings = [
    {
        key: "reservationPendingColor",
        title: "Reservation pending color",
    },
    {
        key: "reservationArrivedColor",
        title: "Reservation arrived color",
    },
    {
        key: "reservationConfirmedColor",
        title: "Reservation confirmed color",
    },
    {
        key: "reservationCancelledColor",
        title: "Reservation cancelled color",
    },
    {
        key: "reservationWaitingForResponseColor",
        title: "Reservation waiting for response color",
    },
] as const;

const props = defineProps<PageAdminPropertySettingsProps>();
const propertiesStore = usePropertiesStore();
const { createDialog } = useDialog();

const property = computed(() => propertiesStore.getPropertyById(props.propertyId));

const propertySettings = computed(function () {
    return propertiesStore.getPropertySettingsById(props.propertyId);
});

const editableSettings = ref(cloneDeep(propertySettings.value));

const { hasChanged, reset: resetPropertiesChangedTracking } = useHasChanged(
    computed(() => editableSettings.value),
);

const aspectRatioOptions = ["1", "16:9"];

function openTimezoneSelector(): void {
    const dialog = createDialog({
        component: FTBottomDialog,
        componentProps: {
            component: FTTimezoneList,
            listeners: {
                timezoneSelected(timezone: string) {
                    dialog.hide();
                    editableSettings.value.timezone = timezone;
                },
            },
        },
    });
}

function reset(): void {
    editableSettings.value = cloneDeep(propertySettings.value);
}

async function saveSettings(): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            if (!hasChanged) {
                return;
            }

            await synchroniseNewPropertySettings(property.value.id);

            resetPropertiesChangedTracking();
        },
    });
}

async function synchroniseNewPropertySettings(propertyId: string): Promise<void> {
    await updatePropertySettings(props.organisationId, propertyId, editableSettings.value);
    propertiesStore.setPropertySettings(propertyId, editableSettings.value);
}
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
                    label="Event duration in hours"
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

        <AppCardSection :aria-label="property.name + ' settings card'">
            <SettingsSection title="Timezone">
                <q-input
                    rounded
                    standout
                    readonly
                    v-model="editableSettings.timezone"
                    @click="openTimezoneSelector()"
                    label="Property timezone"
                />
            </SettingsSection>

            <SettingsSection title="Guest late criteria" v-if="editableSettings">
                <q-input
                    rounded
                    standout
                    type="number"
                    min="1"
                    label="In minutes"
                    hint="Set to 0 to disable"
                    v-model="editableSettings.markGuestAsLateAfterMinutes"
                />
            </SettingsSection>
        </AppCardSection>
    </div>
</template>
