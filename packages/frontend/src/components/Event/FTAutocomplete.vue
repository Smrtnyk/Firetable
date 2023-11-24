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
            rounded
            :debounce="300"
            @input-value="setModel"
            @filter="filterFn"
            @clear="() => emit('clear')"
            :options="options"
        >
            <template #prepend>
                <q-icon name="search" />
            </template>

            <template #no-option>
                <q-item>
                    <q-item-section class="text-grey"> No results </q-item-section>
                </q-item>
            </template>
        </q-select>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { FloorDoc, Reservation } from "@firetable/types";
import { QSelect } from "quasar";

interface Props {
    floors: FloorDoc[];
    allReservedTables: Reservation[];
    showFloorNameInOption: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const selectEl = ref<undefined | QSelect>();
const options = ref(getNamesFromReservations(props.allReservedTables));
const searchTerm = ref("");

function removeFocus(): void {
    nextTick(() => {
        selectEl.value?.blur();
    });
}

function getNamesFromReservations(reservations: Reservation[]): { label: string; value: string }[] {
    return reservations.map((reservation) => {
        return {
            label: createTableLabel(reservation),
            value: reservation.guestName,
        };
    });
}

function createTableLabel(reservation: Reservation): string {
    const label = `${reservation.guestName} (${reservation.tableLabel})`;
    if (props.showFloorNameInOption) {
        const floorName = props.floors.find(({ id }) => id === reservation.floorId);
        return `${label} on ${floorName?.name}`;
    }
    return label;
}

function findSearchedTable(inputVal: string | { value: string }): Reservation[] {
    // Determine the value to match against
    const val = typeof inputVal === "string" ? inputVal : inputVal.value;
    const normalizedVal = val.toLowerCase().trim();

    if (typeof inputVal === "object") {
        // If inputVal is an object, we assume a specific item was selected

        // Remove focus when item is selected to not keep virtual keyboard which is annoying on mobile
        if (normalizedVal.length > 0) {
            removeFocus();
        }

        // Return only the table that matches the guestName exactly
        return props.allReservedTables.filter((reservation) => {
            return reservation.guestName.toLowerCase() === normalizedVal;
        });
    } else {
        // If inputVal is a string, perform the original filtering logic
        const tokens = normalizedVal.split(/\s+/);
        return props.allReservedTables.filter((reservation) => {
            const { guestName } = reservation;
            const normalizedGuestName = guestName.toLowerCase();
            const guestNameTokens = normalizedGuestName.split(/\s+/);

            return tokens.some((token) =>
                guestNameTokens.some((nameToken) => nameToken.includes(token)),
            );
        });
    }
}

function filterFn(val: string, update: any): void {
    update(() => {
        const loweredVal = val.toLowerCase();
        const filteredTables = findSearchedTable(val);
        options.value = filteredTables
            .map((reservation) => ({
                label: createTableLabel(reservation),
                value: reservation.guestName,
            }))
            .filter((option) => option.value.toLowerCase().includes(loweredVal));
    });
}

watch(searchTerm, (newTerm) => {
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
