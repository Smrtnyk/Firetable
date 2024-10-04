<script setup lang="ts">
import type { AnyFunction, FloorDoc, PlannedReservation } from "@firetable/types";

import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";

import { nextTick, ref, watch, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { QSelect } from "quasar";
import { matchesProperty } from "es-toolkit/compat";

export interface FTAutocompleteProps {
    floors: FloorDoc[];
    allReservedTables: PlannedReservation[];
    showFloorNameInOption: boolean;
}

interface Option {
    label: string;
    value: PlannedReservation;
    isVip: boolean;
    arrived: boolean;
}

const props = defineProps<FTAutocompleteProps>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const selectEl = useTemplateRef<QSelect | undefined>("selectEl");
const options = ref(getNamesFromReservations(props.allReservedTables));
const searchTerm = ref("");
const hideArrived = ref(false);

function removeFocus(): void {
    nextTick(function () {
        selectEl.value?.blur();
    });
}

function mapReservationToOption(reservation: PlannedReservation): Option {
    return {
        label: createTableLabel(reservation),
        value: reservation,
        isVip: reservation.isVIP,
        arrived: reservation.arrived,
    };
}

function getNamesFromReservations(
    reservations: PlannedReservation[],
): { label: string; value: PlannedReservation }[] {
    return reservations.map(mapReservationToOption);
}

function createTableLabel(reservation: PlannedReservation): string {
    const label = `${reservation.guestName} (${reservation.tableLabel})`;
    if (props.showFloorNameInOption) {
        const floorName = props.floors.find(matchesProperty("id", reservation.floorId));
        return `${label} on ${floorName?.name}`;
    }
    return label;
}

function findSearchedTable(inputVal: string | { value: PlannedReservation }): PlannedReservation[] {
    // Determine the value to match against
    const val = typeof inputVal === "string" ? inputVal : inputVal.value.guestName;
    const normalizedVal = val.toLowerCase().trim();

    // If inputVal is an object, we assume a specific item was selected
    if (typeof inputVal === "object") {
        // Remove focus when item is selected to not keep virtual keyboard which is annoying on mobile
        if (normalizedVal.length > 0) {
            removeFocus();
        }
        // Return only the table that matches the guestName exactly
        return props.allReservedTables.filter(function (reservation) {
            return (
                reservation.guestName.toLowerCase() === normalizedVal &&
                reservation.floorId === inputVal.value.floorId
            );
        });
    }

    // If inputVal is a string, perform the original filtering logic
    const tokens = normalizedVal.split(/\s+/);
    return props.allReservedTables.filter(function (reservation) {
        const { guestName } = reservation;
        const normalizedGuestName = guestName.toLowerCase();
        const guestNameTokens = normalizedGuestName.split(/\s+/);

        return tokens.some(function (token) {
            return guestNameTokens.some(function (nameToken) {
                return nameToken.includes(token);
            });
        });
    });
}

function filterFn(val: string, update: any): void {
    update(function () {
        const loweredVal = val.toLowerCase();
        const filteredTables = findSearchedTable(val).filter(function (reservation) {
            // Exclude arrived reservations if hideArrived is true
            return !(hideArrived.value && reservation.arrived);
        });
        options.value = filteredTables.map(mapReservationToOption).filter(function (option) {
            return option.value.guestName.toLowerCase().includes(loweredVal);
        });
    });
}

watch(hideArrived, function () {
    filterFn(searchTerm.value, (fn: AnyFunction) => fn());
});

watch(searchTerm, function (newTerm) {
    if (newTerm) {
        const found = findSearchedTable(newTerm);
        emit("found", found);
    } else {
        emit("clear");
    }
});

function setModel(val: string): void {
    searchTerm.value = val;
}
</script>

<template>
    <div class="FTAutocomplete">
        <q-select
            ref="selectEl"
            fill-input
            hide-selected
            use-input
            v-model="searchTerm"
            :label="t(`FTAutocomplete.label`)"
            clearable
            clear-icon="close"
            dense
            standout
            :debounce="300"
            @input-value="setModel"
            @filter="filterFn"
            @clear="() => emit('clear')"
            :options="options"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>

            <template #before-options>
                <q-item>
                    <q-item-section>
                        <q-checkbox v-model="hideArrived" label="Hide arrived" dense @click.stop />
                    </q-item-section>
                </q-item>
            </template>

            <template #option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>
                            {{ scope.opt.label }}
                        </q-item-label>
                    </q-item-section>

                    <q-item-section v-if="scope.opt.arrived" side>
                        <q-icon name="check" color="green" />
                    </q-item-section>
                    <q-item-section v-if="scope.opt.isVip" side>
                        <ReservationVIPChip />
                    </q-item-section>
                </q-item>
            </template>

            <template #no-option>
                <q-item>
                    <q-item-section class="text-grey"> No results </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>
