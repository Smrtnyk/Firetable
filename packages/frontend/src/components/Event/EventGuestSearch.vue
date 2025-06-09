<script setup lang="ts">
import type { FloorDoc, PlannedReservation } from "@firetable/types";
import type { VAutocomplete } from "vuetify/components";

import { refDebounced } from "@vueuse/core";
import { isObject, matchesProperty } from "es-toolkit/compat";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import { nextTick, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface EventGuestSearchProps {
    allReservedTables: PlannedReservation[];
    floors: FloorDoc[];
    showFloorNameInOption: boolean;
}

interface Option {
    arrived: boolean;
    isVip: boolean;
    label: string;
    value: PlannedReservation;
}

const props = defineProps<EventGuestSearchProps>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const selectEl = useTemplateRef<VAutocomplete>("selectEl");
const options = ref<Option[]>([]);
const selectedValue = ref<null | Option>(null);
const searchText = ref("");
const debouncedSearchText = refDebounced(searchText, 300);
const hideArrived = ref(false);

function clearSearch(): void {
    searchText.value = "";
    selectedValue.value = null;
    emit("clear");
}

function createTableLabel(reservation: PlannedReservation): string {
    const label = `${reservation.guestName} (${reservation.tableLabel})`;
    if (props.showFloorNameInOption) {
        const floorName = props.floors.find(matchesProperty("id", reservation.floorId));
        return `${label} ${t("EventGuestSearch.onFloorConnector")} ${floorName?.name}`;
    }
    return label;
}

function findSearchedTable(inputVal: string): PlannedReservation[] {
    const normalizedVal = inputVal.toLowerCase().trim();
    if (!normalizedVal) return props.allReservedTables;

    const tokens = normalizedVal.split(/\s+/);
    return props.allReservedTables.filter((reservation) => {
        const normalizedGuestName = reservation.guestName.toLowerCase();
        const guestNameTokens = normalizedGuestName.split(/\s+/);
        return tokens.some((token) =>
            guestNameTokens.some((nameToken) => nameToken.includes(token)),
        );
    });
}

function mapReservationToOption(reservation: PlannedReservation): Option {
    return {
        arrived: reservation.arrived,
        isVip: reservation.isVIP,
        label: createTableLabel(reservation),
        value: reservation,
    };
}

function removeFocus(): void {
    nextTick(() => {
        (selectEl.value as any)?.blur();
    });
}

function updateFilteredOptions(): void {
    const loweredVal = (debouncedSearchText.value || "").toLowerCase();
    const filteredTables = findSearchedTable(debouncedSearchText.value).filter(
        (reservation) => !(hideArrived.value && reservation.arrived),
    );
    options.value = filteredTables
        .map(mapReservationToOption)
        .filter((option) => option.value.guestName.toLowerCase().includes(loweredVal));
}

watch([debouncedSearchText, hideArrived], updateFilteredOptions, { immediate: true });

watch(selectedValue, (newSelection) => {
    if (!newSelection || !isObject(newSelection)) {
        return;
    }
    emit("found", [newSelection.value]);
    searchText.value = newSelection.label;
    removeFocus();
});
</script>

<template>
    <div class="event-guest-search">
        <v-autocomplete
            ref="selectEl"
            v-model="selectedValue"
            v-model:search="searchText"
            :label="t(`EventGuestSearch.label`)"
            :items="options"
            item-title="label"
            return-object
            density="compact"
            variant="outlined"
            hide-no-data
            @focus="updateFilteredOptions"
        >
            <template #prepend-inner>
                <v-icon icon="fas fa-search" />
            </template>

            <template #append-inner>
                <v-icon
                    v-if="searchText || selectedValue"
                    icon="fas fa-times"
                    size="small"
                    @click.stop="clearSearch"
                    style="cursor: pointer"
                />
            </template>

            <template #prepend-item>
                <v-list-item>
                    <v-checkbox-btn
                        v-model="hideArrived"
                        :label="t('EventGuestSearch.hideArrivedLabel')"
                        density="compact"
                        @click.stop
                    />
                </v-list-item>
                <v-divider />
            </template>

            <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                    <template #append>
                        <v-icon
                            v-if="item.raw.arrived"
                            icon="fas fa-check"
                            color="green"
                            class="mr-2"
                            :aria-label="t('EventGuestSearch.guestArrivedIconAriaLabel')"
                        />
                        <ReservationVIPChip v-if="item.raw.isVip" />
                    </template>
                </v-list-item>
            </template>

            <template #no-data>
                <v-list-item>
                    <v-list-item-title class="text-grey">
                        {{ t("EventGuestSearch.noResultsText") }}
                    </v-list-item-title>
                </v-list-item>
            </template>
        </v-autocomplete>
    </div>
</template>
