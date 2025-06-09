<script setup lang="ts">
import type { DateRange } from "src/types";

import { isDate } from "es-toolkit";
import FTBtn from "src/components/FTBtn.vue";
import { useHasChanged } from "src/composables/useHasChanged";
import { ONE_HOUR } from "src/constants";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

export interface FTTimeframeSelectorProps {
    maxDate?: string;
    maxDays?: number;
    minDate?: string;
    modelValue?: DateRange;
    presets?: PresetOption[];
}

interface PresetOption {
    title: string;
    value: string;
}

const {
    maxDate = "2050-12-31",
    maxDays = 365,
    minDate = "2000-01-01",
} = defineProps<FTTimeframeSelectorProps>();

const emit = defineEmits<{
    (e: "update:modelValue", value: DateRange): void;
    (e: "error", message: string): void;
}>();

const { locale, t } = useI18n();

const presets = ref<PresetOption[]>([
    { title: t("FTTimeframeSelector.today"), value: "today" },
    { title: t("FTTimeframeSelector.yesterday"), value: "yesterday" },
    { title: t("FTTimeframeSelector.last7Days"), value: "last7" },
    { title: t("FTTimeframeSelector.last30Days"), value: "last30" },
    { title: t("FTTimeframeSelector.custom"), value: "custom" },
]);

const selectedPreset = ref<string>("");
const pendingPreset = ref<string>("");
const dateMenu = ref(false);
const error = ref("");

// v-date-picker (range) v-model is an array of Date objects
const datePickerModel = ref<Date[]>([]);

// A computed property to bridge Vuetify's array model and your object model
const dateRange = computed({
    get: () => {
        const [from, to] = datePickerModel.value;
        return {
            from: from ? from.toISOString().split("T")[0] : "",
            to: to ? to.toISOString().split("T")[0] : "",
        };
    },
    set: (val) => {
        if (val?.from && val.to) {
            datePickerModel.value = [new Date(val.from), new Date(val.to)];
        } else {
            datePickerModel.value = [];
        }
    },
});

const { hasChanged: presetHasChanged, reset: resetPresetHasChanged } = useHasChanged(pendingPreset);
const { hasChanged: dateRangeHasChanged, reset: resetDateRangeHasChanged } =
    useHasChanged(datePickerModel);

const isValidDateRange = computed(() => {
    const [start, end] = datePickerModel.value;
    if (!start || !end) return false;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= maxDays;
});

const hasValidSelection = computed(() => {
    if (pendingPreset.value && pendingPreset.value !== "custom") {
        return presetHasChanged.value;
    } else if (pendingPreset.value === "custom") {
        return dateRangeHasChanged.value && isValidDateRange.value;
    }
    return false;
});

function applyCurrentSelection(): void {
    if (pendingPreset.value === "custom") {
        if (!isValidDateRange.value) {
            const message =
                datePickerModel.value.length < 2
                    ? t("FTTimeframeSelector.errorSelectDates")
                    : t("FTTimeframeSelector.errorMaxDays", { maxDays });
            emit("error", message);
            return;
        }
        selectedPreset.value = "custom";
        emitValue({ endDate: dateRange.value.to, startDate: dateRange.value.from });
    } else if (pendingPreset.value) {
        try {
            const range = calculatePresetDates(pendingPreset.value);
            selectedPreset.value = pendingPreset.value;
            emitValue(range);
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : t("FTTimeframeSelector.invalidPreset");
            pendingPreset.value = selectedPreset.value;
        }
    }
    resetPresetHasChanged();
    resetDateRangeHasChanged();
}

function applyDateRange(): void {
    if (!isValidDateRange.value) {
        const message =
            datePickerModel.value.length < 2
                ? t("FTTimeframeSelector.errorSelectDates")
                : t("FTTimeframeSelector.errorMaxDays", { maxDays });
        emit("error", message);
        return;
    }
    selectedPreset.value = "custom";
    pendingPreset.value = "custom";
    dateMenu.value = false;
}

function calculatePresetDates(preset: string): DateRange {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (preset) {
        case "last7":
            startDate.setDate(today.getDate() - 6);
            break;
        case "last30":
            startDate.setDate(today.getDate() - 29);
            break;
        case "today":
            // No change needed
            break;
        case "yesterday":
            startDate.setDate(today.getDate() - 1);
            endDate.setDate(today.getDate() - 1);
            break;
        default:
            throw new Error(t("FTTimeframeSelector.errorInvalidPreset", { preset }));
    }
    return {
        endDate: endDate.toISOString().split("T")[0],
        startDate: startDate.toISOString().split("T")[0],
    };
}

function clearDateRange(): void {
    datePickerModel.value = [];
}

function dateOptions(date: unknown): boolean {
    if (!isDate(date)) return false;
    // If only one date is selected, check if the potential second date is within the maxDays range
    if (datePickerModel.value.length === 1) {
        const start = datePickerModel.value[0];
        const diffDays = Math.ceil(Math.abs(date.getTime() - start.getTime()) / (ONE_HOUR * 24));
        return diffDays < maxDays;
    }
    return true;
}

function emitValue(value: DateRange): void {
    emit("update:modelValue", value);
}

function formatDateDisplay(dateStr: string): string {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const date = new Date(dateStr);
    // Add time zone to prevent off-by-one day errors
    return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000).toLocaleDateString(
        locale.value,
        options,
    );
}

function handlePresetChange(value: string): void {
    error.value = "";
    pendingPreset.value = value;
    if (value === "custom") {
        dateMenu.value = true;
    }
}
</script>

<template>
    <div class="timeframe-selector">
        <v-select
            v-model="pendingPreset"
            :items="presets"
            :label="t('FTTimeframeSelector.selectTimeframe')"
            :error-messages="error"
            @update:model-value="handlePresetChange"
            variant="outlined"
            hide-details="auto"
        >
            <template #selection="{ item }">
                <span v-if="item.value !== 'custom'">
                    {{ item.title }}
                </span>
                <span v-else>
                    <span v-if="dateRange && dateRange.from && dateRange.to">
                        {{ formatDateDisplay(dateRange.from) }} {{ t("FTTimeframeSelector.to") }}
                        {{ formatDateDisplay(dateRange.to) }}
                    </span>
                    <span v-else> {{ t("FTTimeframeSelector.selectDateRange") }} </span>
                </span>
            </template>

            <template #append>
                <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom end">
                    <template #activator="{ props: menuProps }">
                        <v-icon
                            v-bind="menuProps"
                            icon="fas fa-calendar"
                            class="mr-2"
                            :aria-label="t('FTTimeframeSelector.openDatePicker')"
                        />
                    </template>
                    <v-date-picker
                        v-model="datePickerModel"
                        range
                        :min="minDate"
                        :max="maxDate"
                        :allowed-dates="dateOptions"
                    >
                        <template #actions>
                            <FTBtn
                                icon="fas fa-trash-alt"
                                color="error"
                                :aria-label="t('FTTimeframeSelector.clearCustomDateRangeAriaLabel')"
                                @click="clearDateRange"
                                :disabled="datePickerModel.length === 0"
                            />
                            <v-spacer />
                            <FTBtn
                                :label="t('FTTimeframeSelector.cancel')"
                                color="secondary"
                                @click="dateMenu = false"
                                :aria-label="
                                    t('FTTimeframeSelector.cancelCustomDateRangeAriaLabel')
                                "
                            />
                            <FTBtn
                                :label="t('FTTimeframeSelector.apply')"
                                :aria-label="t('FTTimeframeSelector.applyCustomDateRangeAriaLabel')"
                                color="primary"
                                @click="applyDateRange"
                                :disabled="!isValidDateRange"
                            />
                        </template>
                    </v-date-picker>
                </v-menu>

                <v-btn
                    variant="tonal"
                    rounded="lg"
                    color="primary"
                    @click.stop="applyCurrentSelection"
                    :disabled="!hasValidSelection"
                    >{{ t("FTTimeframeSelector.apply") }}</v-btn
                >
            </template>
        </v-select>
    </div>
</template>
