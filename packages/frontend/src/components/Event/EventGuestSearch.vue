<script setup lang="ts">
import type { AnyFunction, FloorDoc, PlannedReservation } from "@firetable/types";

import { isString } from "es-toolkit";
import { isObject, matchesProperty } from "es-toolkit/compat";
import { QSelect } from "quasar";
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

const selectEl = useTemplateRef<QSelect | undefined>("selectEl");
const options = ref(getNamesFromReservations(props.allReservedTables));
const searchTerm = ref("");
const hideArrived = ref(false);

function createTableLabel(reservation: PlannedReservation): string {
    const label = `${reservation.guestName} (${reservation.tableLabel})`;
    if (props.showFloorNameInOption) {
        const floorName = props.floors.find(matchesProperty("id", reservation.floorId));
        return `${label} ${t("EventGuestSearch.onFloorConnector")} ${floorName?.name}`;
    }
    return label;
}

function filterFn(val: string, update: any): void {
    update(function () {
        const loweredVal = val.toLowerCase();
        const filteredTables = findSearchedTable(val).filter(function (reservation) {
            // Exclude arrived reservations if hideArrived is true
            return !(hideArrived.value && reservation.arrived);
        });

        const mappedOptions = filteredTables.map(mapReservationToOption).filter(function (option) {
            return option.value.guestName.toLowerCase().includes(loweredVal);
        });

        // NOTE: a quasar workaround to keep the before-options slot rendered
        // If no options after filtering but hideArrived is true, add a dummy option to keep dropdown open
        if (mappedOptions.length === 0 && hideArrived.value) {
            options.value = [
                {
                    // @ts-expect-error -- a workaround to keep the before-options slot rendered
                    isDummy: true,
                    label: "",
                    value: null as any,
                },
            ];
        } else {
            options.value = mappedOptions;
        }
    });
}

function findSearchedTable(inputVal: string | { value: PlannedReservation }): PlannedReservation[] {
    const val = isString(inputVal) ? inputVal : inputVal.value.guestName;
    const normalizedVal = val.toLowerCase().trim();

    // If inputVal is an object, we assume a specific item was selected
    if (isObject(inputVal)) {
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

function getNamesFromReservations(
    reservations: PlannedReservation[],
): { label: string; value: PlannedReservation }[] {
    return reservations.map(mapReservationToOption);
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
    nextTick(function () {
        selectEl.value?.blur();
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
    <div class="EventGuestSearch">
        <q-select
            ref="selectEl"
            fill-input
            hide-selected
            use-input
            v-model="searchTerm"
            :label="t(`EventGuestSearch.label`)"
            clearable
            clear-icon="fa fa-close"
            dense
            hide-dropdown-icon
            outlined
            :debounce="300"
            @input-value="setModel"
            @filter="filterFn"
            @clear="() => emit('clear')"
            :options="options"
        >
            <template #prepend>
                <q-icon name="fa fa-search" size="xs" />
            </template>

            <template #before-options>
                <q-item>
                    <q-item-section>
                        <q-checkbox
                            v-model="hideArrived"
                            :label="t('EventGuestSearch.hideArrivedLabel')"
                            dense
                            @click.stop
                        />
                    </q-item-section>
                </q-item>
                <q-separator />
            </template>

            <template #option="scope">
                <!-- Don't render dummy option that is a workaround -->
                <q-item v-if="!scope.opt.isDummy" v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>
                            {{ scope.opt.label }}
                        </q-item-label>
                    </q-item-section>

                    <q-item-section v-if="scope.opt.arrived" side>
                        <q-icon
                            name="fa fa-check"
                            color="green"
                            :aria-label="t('EventGuestSearch.guestArrivedIconAriaLabel')"
                        />
                    </q-item-section>
                    <q-item-section v-if="scope.opt.isVip" side>
                        <ReservationVIPChip />
                    </q-item-section>
                </q-item>
            </template>

            <template #no-option>
                <q-item>
                    <q-item-section class="text-grey">
                        {{ t("EventGuestSearch.noResultsText") }}
                    </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>
