<script setup lang="ts">
import type { DateRange } from "src/types";

import { isDate } from "es-toolkit";
import { ONE_HOUR } from "src/constants";
import { formatLocalDateToISOString, parseISODateStringToLocalDate } from "src/helpers/date-utils";
import { AppLogger } from "src/logger/FTLogger";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface FTTimeframeSelectorProps {
    maxDate?: string;
    maxDays?: number;
    minDate?: string;
    modelValue?: DateRange;
}

interface PresetOption {
    title: string;
    value: string;
}

const {
    maxDate = "2050-12-31",
    maxDays = 365,
    minDate = "2000-01-01",
    modelValue,
} = defineProps<FTTimeframeSelectorProps>();

const emit = defineEmits<{
    (e: "update:modelValue", value: DateRange): void;
    (e: "error", message: string): void;
}>();

const { t } = useI18n();

const internalPresets = computed<PresetOption[]>(() => [
    { title: t("FTTimeframeSelector.today"), value: "today" },
    { title: t("FTTimeframeSelector.yesterday"), value: "yesterday" },
    { title: t("FTTimeframeSelector.last7Days"), value: "last7" },
    { title: t("FTTimeframeSelector.last30Days"), value: "last30" },
]);

const selectedPreset = ref<string>("");
const dateInputValue = ref<[] | [Date, Date] | [Date]>([]);

watch(
    () => modelValue,
    (newModelValue) => {
        if (newModelValue?.from && newModelValue.to) {
            try {
                const fromDate = parseISODateStringToLocalDate(newModelValue.from);
                const toDate = parseISODateStringToLocalDate(newModelValue.to);
                if (
                    dateInputValue.value.length !== 2 ||
                    dateInputValue.value[0]?.getTime() !== fromDate.getTime() ||
                    dateInputValue.value[1]?.getTime() !== toDate.getTime()
                ) {
                    dateInputValue.value = [fromDate, toDate];
                }
            } catch (e) {
                AppLogger.error("Error parsing modelValue dates:", e);
                dateInputValue.value = [];
            }
        } else if (
            dateInputValue.value.length > 0 &&
            (!newModelValue || (!newModelValue.from && !newModelValue.to))
        ) {
            dateInputValue.value = [];
        }
        updateSelectedPresetBasedOnDateInput();
    },
    { deep: true, immediate: true },
);

watch(
    dateInputValue,
    function (newRange) {
        if (newRange && newRange.length >= 2) {
            const startCandidate = newRange[0];
            const endCandidate = newRange[newRange.length - 1];

            if (isDate(startCandidate) && isDate(endCandidate)) {
                const newFrom = formatLocalDateToISOString(startCandidate);
                const newTo = formatLocalDateToISOString(endCandidate);
                const valueToEmit: DateRange = { from: newFrom, to: newTo };

                if (modelValue?.from !== valueToEmit.from || modelValue?.to !== valueToEmit.to) {
                    emit("update:modelValue", valueToEmit);
                }
            }
        } else if (newRange && newRange.length === 1) {
            // Intermediate state, first date picked
        } else if (
            (!newRange || newRange.length === 0) &&
            modelValue &&
            (modelValue.from || modelValue.to)
        ) {
            emit("update:modelValue", { from: "", to: "" });
        }
        updateSelectedPresetBasedOnDateInput();
    },
    { deep: true },
);

function calculatePresetDates(preset: string): { from: string; to: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDateObj = new Date(today);
    const toDateObj = new Date(today);

    switch (preset) {
        case "last7":
            fromDateObj.setDate(today.getDate() - 6);
            break;
        case "last30":
            fromDateObj.setDate(today.getDate() - 29);
            break;
        case "today":
            break;
        case "yesterday":
            fromDateObj.setDate(today.getDate() - 1);
            toDateObj.setDate(today.getDate() - 1);
            break;
        default:
            emit("error", t("FTTimeframeSelector.errorInvalidPreset", { preset }));
            AppLogger.error(t("FTTimeframeSelector.errorInvalidPreset", { preset }));
            throw new Error(t("FTTimeframeSelector.errorInvalidPreset", { preset }));
    }
    return {
        from: formatLocalDateToISOString(fromDateObj),
        to: formatLocalDateToISOString(toDateObj),
    };
}

function handleChipClick(presetValue: string): void {
    try {
        const range = calculatePresetDates(presetValue);
        const fromDate = parseISODateStringToLocalDate(range.from);
        const toDate = parseISODateStringToLocalDate(range.to);
        dateInputValue.value = [fromDate, toDate];
    } catch (err) {
        AppLogger.error("Error applying preset:", err);
    }
}

function updateSelectedPresetBasedOnDateInput(): void {
    let matchedPresetValue = "";
    if (dateInputValue.value && dateInputValue.value.length === 2) {
        const firstDate = dateInputValue.value[0];
        const secondDate = dateInputValue.value[1];
        if (!isDate(firstDate) || !isDate(secondDate)) {
            return;
        }
        const currentFromISO = formatLocalDateToISOString(firstDate);
        const currentToISO = formatLocalDateToISOString(secondDate);

        for (const preset of internalPresets.value) {
            const presetDates = calculatePresetDates(preset.value);
            if (presetDates.from === currentFromISO && presetDates.to === currentToISO) {
                matchedPresetValue = preset.value;
                break;
            }
        }
    }

    selectedPreset.value = matchedPresetValue;
}

const dateRangeRules = computed(() => [
    (value: [Date, Date] | Date[] | null) => {
        if (value && value.length === 2) {
            const [start, end] = value;
            if (!start || !end || !isDate(start) || !isDate(end))
                return t("FTTimeframeSelector.errorSelectDates");
            if (start.getTime() > end.getTime())
                return t("FTTimeframeSelector.errorEndDateBeforeStartDate");

            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (ONE_HOUR * 24));
            if (diffDays >= maxDays) {
                return t("FTTimeframeSelector.errorMaxDays", { maxDays });
            }
        } else if (value && value.length === 1) {
            return t("FTTimeframeSelector.errorSelectEndDate");
        }
        return true;
    },
]);

function restrictSecondDateSelection(dateCandidate: unknown): boolean {
    if (!isDate(dateCandidate)) return false;

    if (dateInputValue.value && dateInputValue.value.length === 1) {
        const startDate = dateInputValue.value[0];
        if (!isDate(startDate)) return false;
        if (dateCandidate.getTime() < startDate.getTime()) return false;

        const diffDays = Math.ceil(
            (dateCandidate.getTime() - startDate.getTime()) / (ONE_HOUR * 24),
        );
        return diffDays < maxDays;
    }
    return true;
}
</script>

<template>
    <div class="timeframe-selector">
        <v-chip-group
            v-model="selectedPreset"
            class="mb-4"
            mandatory="force"
            @update:model-value="handleChipClick"
        >
            <v-chip
                v-for="preset in internalPresets"
                :key="preset.value"
                :value="preset.value"
                label
                size="small"
            >
                {{ preset.title }}
            </v-chip>
        </v-chip-group>

        <VDateInput
            v-model="dateInputValue"
            :label="t('FTTimeframeSelector.selectDateRange')"
            :aria-label="t('FTTimeframeSelector.selectDateRange')"
            multiple="range"
            :min="minDate"
            :max="maxDate"
            :rules="dateRangeRules"
            :allowed-dates="restrictSecondDateSelection"
            clearable
            variant="outlined"
            density="compact"
            hide-details="auto"
            :placeholder="t('FTTimeframeSelector.dateRangePlaceholder')"
        />
    </div>
</template>

<style scoped>
.timeframe-selector {
    width: 100%;
}
</style>
