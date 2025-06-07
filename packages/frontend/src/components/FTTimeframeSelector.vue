<template>
    <div class="timeframe-selector">
        <q-select
            v-model="selectedPreset"
            :options="presets"
            :label="t('FTTimeframeSelector.selectTimeframe')"
            @update:model-value="handlePresetChange"
            :error="!!error"
            :error-message="error"
            outlined
            emit-value
            map-options
            hide-dropdown-icon
        >
            <template #append>
                <q-icon
                    name="calendar"
                    :aria-label="t('FTTimeframeSelector.openDatePicker')"
                    @click.stop.prevent="toggleDateRangePicker"
                    @mousedown.stop.prevent
                    class="q-mr-sm"
                />

                <q-btn
                    unelevated
                    rounded
                    color="primary"
                    :label="t('FTTimeframeSelector.apply')"
                    @click.stop="applyCurrentSelection"
                    :disabled="!hasValidSelection"
                />
            </template>

            <template #selected-item="scope">
                <span v-if="scope.opt.value !== 'custom'">
                    {{ scope.opt.label }}
                </span>
                <span v-else>
                    <span v-if="dateRange && dateRange.from && dateRange.to">
                        {{ formatDateDisplay(dateRange.from) }} {{ t("FTTimeframeSelector.to") }}
                        {{ formatDateDisplay(dateRange.to) }}
                    </span>
                    <span v-else> {{ t("FTTimeframeSelector.selectDateRange") }} </span>
                </span>
            </template>
        </q-select>

        <q-popup-proxy
            ref="datePickerProxy"
            anchor="bottom right"
            self="top right"
            transition-show="scale"
            transition-hide="scale"
            class="date-range-picker"
            @hide="resetCustomSelection"
            :no-parent-event="true"
            :auto-close="false"
        >
            <q-date
                v-model="dateRange"
                range
                mask="YYYY-MM-DD"
                today-btn
                :min="minDate"
                :max="maxDate"
                :options="dateOptions"
                @range-start="handleRangeStart"
                @range-end="handleRangeEnd"
                :aria-label="t('FTTimeframeSelector.customDateRangePickerAriaLabel')"
            >
                <div class="row items-center justify-end q-gutter-sm">
                    <FTBtn
                        padding="sm"
                        icon="fa fa-trash"
                        color="negative"
                        :aria-label="t('FTTimeframeSelector.clearCustomDateRangeAriaLabel')"
                        @click="clearDateRange"
                        :disabled="!dateRange.from && !dateRange.to"
                    />
                    <q-space />
                    <FTBtn
                        padding="sm"
                        :label="t('FTTimeframeSelector.cancel')"
                        color="secondary"
                        @click="closeDateRangePicker"
                        :aria-label="t('FTTimeframeSelector.cancelCustomDateRangeAriaLabel')"
                    />
                    <FTBtn
                        padding="sm"
                        :label="t('FTTimeframeSelector.apply')"
                        :aria-label="t('FTTimeframeSelector.applyCustomDateRangeAriaLabel')"
                        color="primary"
                        @click="applyDateRange"
                        :disabled="!isValidDateRange"
                    />
                </div>
            </q-date>
        </q-popup-proxy>
    </div>
</template>

<script setup lang="ts">
import type { DateRange } from "src/types";

import { isNil } from "es-toolkit/predicate";
import { QPopupProxy } from "quasar";
import FTBtn from "src/components/FTBtn.vue";
import { useHasChanged } from "src/composables/useHasChanged";
import { ONE_HOUR } from "src/constants";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface FTTimeframeSelectorProps {
    maxDate?: string;
    maxDays?: number;
    minDate?: string;
    modelValue?: DateRange;
    presets?: PresetOption[];
}

interface PresetOption {
    label: string;
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

const presets = ref([
    { label: t("FTTimeframeSelector.today"), value: "today" },
    { label: t("FTTimeframeSelector.yesterday"), value: "yesterday" },
    { label: t("FTTimeframeSelector.last7Days"), value: "last7" },
    { label: t("FTTimeframeSelector.last30Days"), value: "last30" },
    { label: t("FTTimeframeSelector.custom"), value: "custom" },
]);

const selectedPreset = ref<string>("");
const pendingPreset = ref<string>("");
const dateRange = ref<{ from: string; to: string }>({ from: "", to: "" });
const error = ref("");
const rangeStartDate = ref<string>("");
const datePickerProxy = useTemplateRef("datePickerProxy");

const { hasChanged: presetHasChanged, reset: resetPresetHasChanged } = useHasChanged(pendingPreset);
const { hasChanged: dateRangeHasChanged, reset: resetDateRangeHasChanged } =
    useHasChanged(dateRange);

const hasValidSelection = computed(() => {
    if (pendingPreset.value && pendingPreset.value !== "custom") {
        // For non-custom presets, enable Apply if preset has changed
        return presetHasChanged.value;
    } else if (pendingPreset.value === "custom") {
        // For custom preset, enable Apply if date range has changed and is valid
        return dateRangeHasChanged.value && isValidDateRange.value;
    }
    return false;
});

watch(dateRange, function (newVal) {
    if (isNil(newVal)) {
        dateRange.value = { from: "", to: "" };
    }
});

function closeDateRangePicker(): void {
    datePickerProxy.value?.hide();
    if (pendingPreset.value === "custom" && !isValidDateRange.value) {
        pendingPreset.value = selectedPreset.value;
    }
}

function dateOptions(date: string): boolean {
    if (!rangeStartDate.value) {
        return true;
    }

    const start = new Date(rangeStartDate.value);
    const current = new Date(date);
    const diffDays = Math.ceil((current.getTime() - start.getTime()) / (ONE_HOUR * 24));

    return diffDays <= maxDays;
}

function formatDateDisplay(dateStr: string): string {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale.value, options);
}

function toggleDateRangePicker(): void {
    datePickerProxy.value?.toggle();
    if (pendingPreset.value === "custom") {
        pendingPreset.value = "";
    } else {
        pendingPreset.value = selectedPreset.value;
    }
}

const isValidDateRange = computed(() => {
    if (!dateRange.value.from || !dateRange.value.to) {
        return false;
    }

    const start = new Date(dateRange.value.from);
    const end = new Date(dateRange.value.to);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
    }

    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= maxDays;
});

function applyCurrentSelection(): void {
    if (pendingPreset.value === "custom") {
        if (!isValidDateRange.value) {
            const message =
                !dateRange.value.from || !dateRange.value.to
                    ? t("FTTimeframeSelector.errorSelectDates")
                    : t("FTTimeframeSelector.errorMaxDays", { maxDays });
            emit("error", message);
            return;
        }

        selectedPreset.value = "custom";
        emitValue({
            endDate: dateRange.value.to,
            startDate: dateRange.value.from,
        });
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
            !dateRange.value.from || !dateRange.value.to
                ? t("FTTimeframeSelector.errorSelectDates")
                : t("FTTimeframeSelector.errorMaxDays", { maxDays });
        emit("error", message);
        return;
    }

    selectedPreset.value = "custom";
    pendingPreset.value = "custom";
    datePickerProxy.value?.hide();
}

function calculatePresetDates(preset: string): DateRange {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0",
    )}-${String(today.getDate()).padStart(2, "0")}`;

    let startDate: null | string = null;
    let endDate: string = todayStr;

    switch (preset) {
        case "last7": {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 6);
            startDate = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(
                2,
                "0",
            )}-${String(weekAgo.getDate()).padStart(2, "0")}`;
            break;
        }
        case "last30": {
            const monthAgo = new Date(today);
            monthAgo.setDate(today.getDate() - 29);
            startDate = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(
                2,
                "0",
            )}-${String(monthAgo.getDate()).padStart(2, "0")}`;
            break;
        }
        case "today":
            startDate = todayStr;
            break;
        case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            startDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
                2,
                "0",
            )}-${String(yesterday.getDate()).padStart(2, "0")}`;
            endDate = startDate;
            break;
        }
        default:
            throw new Error(`Invalid preset: ${preset}`);
    }

    if (!startDate) {
        throw new Error("Start date calculation failed.");
    }

    return {
        endDate,
        startDate,
    };
}

function clearDateRange(): void {
    dateRange.value = { from: "", to: "" };
    rangeStartDate.value = "";
}

function emitValue(value: DateRange): void {
    emit("update:modelValue", value);
}

function handlePresetChange(value: string): void {
    error.value = "";
    pendingPreset.value = value;

    if (value === "custom") {
        datePickerProxy.value?.show();
    }
}

function handleRangeEnd(): void {
    rangeStartDate.value = "";
}

function handleRangeStart(from: null | { day: number; month: number; year: number }): void {
    if (!from) {
        return;
    }
    rangeStartDate.value = new Date(from.year, from.month - 1, from.day).toISOString();
}

function resetCustomSelection(): void {
    if (pendingPreset.value === "custom" && !isValidDateRange.value) {
        pendingPreset.value = selectedPreset.value;
    }
}
</script>

<style scoped>
.timeframe-selector {
    position: relative;
    width: 100%;
}

.date-range-picker {
    width: 100%;
    max-width: 400px;
}
</style>
