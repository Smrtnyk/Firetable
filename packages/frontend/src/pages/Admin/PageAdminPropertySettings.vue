<script setup lang="ts">
import { cloneDeep } from "es-toolkit";
import SettingsSection from "src/components/admin/organisation-settings/SettingsSection.vue";
import AppCardSection from "src/components/AppCardSection.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTTimezoneList from "src/components/FTTimezoneList.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalBottomSheet } from "src/composables/useBottomSheet";
import { useHasChanged } from "src/composables/useHasChanged";
import { updatePropertySettings } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";

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
    const dialog = globalBottomSheet.openBottomSheet(FTTimezoneList, {
        onTimezoneSelected(timezone: string) {
            dialog.hide();
            editableSettings.value.timezone = timezone;
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
                    variant="tonal"
                    class="button-gradient mr-2"
                    :disabled="!hasChanged"
                    @click="saveSettings"
                >
                    Save
                </FTBtn>
                <FTBtn variant="tonal" color="primary" :disabled="!hasChanged" @click="reset">
                    Reset
                </FTBtn>
            </template>
        </FTTitle>

        <AppCardSection title="Event">
            <SettingsSection title="Default event start time">
                <v-menu :close-on-content-click="false">
                    <template #activator="{ props }">
                        <v-text-field
                            :model-value="editableSettings.event.eventStartTime24HFormat"
                            label="Start time"
                            variant="outlined"
                            readonly
                            v-bind="props"
                            append-inner-icon="fas fa-clock"
                        ></v-text-field>
                    </template>
                    <v-time-picker
                        v-model="editableSettings.event.eventStartTime24HFormat"
                        format="24hr"
                    ></v-time-picker>
                </v-menu>
            </SettingsSection>

            <SettingsSection title="Event duration in hours">
                <v-text-field
                    variant="outlined"
                    label="Event duration in hours"
                    v-model.number="editableSettings.event.eventDurationInHours"
                />
            </SettingsSection>

            <SettingsSection title="Event card aspect ratio">
                <v-select
                    variant="outlined"
                    label="Aspect ratio"
                    v-model="editableSettings.event.eventCardAspectRatio"
                    :items="aspectRatioOptions"
                />
            </SettingsSection>

            <SettingsSection
                v-for="colorSetting in colorsSettings"
                :key="colorSetting.key"
                :title="colorSetting.title"
            >
                <v-menu :close-on-content-click="false">
                    <template #activator="{ props }">
                        <v-btn
                            block
                            size="x-large"
                            :color="editableSettings.event[colorSetting.key]"
                            v-bind="props"
                        >
                            {{ editableSettings.event[colorSetting.key] }}
                            <v-icon end>fas fa-palette</v-icon>
                        </v-btn>
                    </template>
                    <v-color-picker v-model="editableSettings.event[colorSetting.key]" />
                </v-menu>
            </SettingsSection>
        </AppCardSection>

        <AppCardSection title="Guest">
            <SettingsSection title="Collect guest data">
                <v-switch
                    v-model="editableSettings.guest.collectGuestData"
                    :label="editableSettings.guest.collectGuestData ? 'On' : 'Off'"
                    color="primary"
                    inset
                />
            </SettingsSection>
        </AppCardSection>

        <AppCardSection :aria-label="property.name + ' settings card'">
            <SettingsSection title="Timezone">
                <v-text-field
                    variant="outlined"
                    readonly
                    v-model="editableSettings.timezone"
                    @click="openTimezoneSelector()"
                    label="Property timezone"
                />
            </SettingsSection>

            <SettingsSection title="Guest late criteria" v-if="editableSettings">
                <v-text-field
                    variant="outlined"
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
``` I have updated the icons for the time picker and the color palette button to their Font Awesome
equivalents as you requested. Let me know if you need any other chang
