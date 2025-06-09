<script setup lang="ts">
import type { FloorDoc, PlannedReservation, PlannedReservationDoc } from "@firetable/types";

import { matchesProperty, uniqBy } from "es-toolkit/compat";
import ReservationVIPChip from "src/components/Event/reservation/ReservationVIPChip.vue";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";

export interface EventGuestSearchProps {
    allReservedTables: PlannedReservationDoc[];
    floors: FloorDoc[];
    showFloorNameInOption: boolean;
}

interface Option {
    arrived: boolean;
    id: string;
    isVip: boolean;
    label: string;
    value: PlannedReservation;
}

const props = defineProps<EventGuestSearchProps>();
const emit = defineEmits(["found", "clear"]);
const { t } = useI18n();

const selectEl = useTemplateRef<any>("selectEl");
const selectedItem = ref<null | Option>(null);
const searchInput = ref("");
const hideArrived = ref(false);

const SEARCH_RESULT_LIMIT = 50;

const displayOptions = computed(() => {
    let baseReservations = props.allReservedTables;

    if (hideArrived.value) {
        baseReservations = baseReservations.filter(function (reservation) {
            return !reservation.arrived;
        });
    }

    if (searchInput.value) {
        const normalizedVal = searchInput.value.toLowerCase().trim();
        const tokens = normalizedVal.split(/\s+/);

        baseReservations = baseReservations.filter(function (reservation) {
            const guestName = reservation.guestName.toLowerCase();
            const guestNameTokens = guestName.split(/\s+/);

            return tokens.some(function (token) {
                return guestNameTokens.some(function (nameToken) {
                    return nameToken.includes(token);
                });
            });
        });
    }

    const limitedReservations = searchInput.value
        ? baseReservations
        : baseReservations.slice(0, SEARCH_RESULT_LIMIT);

    const options = limitedReservations.map(mapReservationToOption);

    // Ensure uniqueness by the composite ID
    return uniqBy(options, function (option) {
        return option.id;
    });
});

function createTableLabel(reservation: PlannedReservation): string {
    const label = `${reservation.guestName} (${reservation.tableLabel})`;
    if (props.showFloorNameInOption) {
        const floorName = props.floors.find(matchesProperty("id", reservation.floorId));
        return `${label} ${t("EventGuestSearch.onFloorConnector")} ${floorName?.name}`;
    }
    return label;
}

function mapReservationToOption(reservation: PlannedReservationDoc): Option {
    return {
        arrived: reservation.arrived,
        id: `${reservation.id}-${reservation.floorId}`,
        isVip: reservation.isVIP,
        label: createTableLabel(reservation),
        value: reservation,
    };
}

function onClear(): void {
    selectedItem.value = null;
    searchInput.value = "";
    emit("clear");
}

function onSearchUpdate(value: string): void {
    searchInput.value = value;

    if (!value) {
        emit("clear");
        return;
    }

    const currentResults = displayOptions.value.map(function (option) {
        return option.value;
    });
    emit("found", currentResults);
}

function onSelect(item: null | Option): void {
    if (!item) {
        emit("clear");
        return;
    }

    emit("found", [item.value]);
    removeFocus();
}

function removeFocus(): void {
    nextTick(function () {
        selectEl.value?.blur();
    });
}

watch(hideArrived, function () {
    if (searchInput.value) {
        const currentResults = displayOptions.value.map(function (option) {
            return option.value;
        });
        emit("found", currentResults);
    }
});
</script>

<template>
    <div class="EventGuestSearch">
        <v-autocomplete
            ref="selectEl"
            v-model="selectedItem"
            v-model:search="searchInput"
            :items="displayOptions"
            :label="t('EventGuestSearch.label')"
            item-title="label"
            item-value="id"
            :custom-filter="() => true"
            return-object
            density="compact"
            variant="outlined"
            clearable
            hide-details
            no-filter
            @update:model-value="onSelect"
            @update:search="onSearchUpdate"
            @click:clear="onClear"
            class="EventGuestSearch__select"
        >
            <template v-slot:prepend-inner>
                <v-icon size="small" color="grey-darken-1">fas fa-search</v-icon>
            </template>

            <template v-slot:prepend-item>
                <div class="EventGuestSearch__filter-header">
                    <v-checkbox
                        v-model="hideArrived"
                        :label="t('EventGuestSearch.hideArrivedLabel')"
                        density="comfortable"
                        hide-details
                        @click.stop
                        class="EventGuestSearch__checkbox"
                    />
                </div>
                <v-divider />
            </template>

            <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props" density="compact">
                    <template v-slot:title>
                        {{ item.raw.label }}
                    </template>

                    <template v-slot:append>
                        <div class="EventGuestSearch__badges">
                            <v-icon
                                size="small"
                                v-if="item.raw.arrived"
                                color="success"
                                :aria-label="t('EventGuestSearch.guestArrivedIconAriaLabel')"
                            >
                                fas fa-check
                            </v-icon>
                            <ReservationVIPChip v-if="item.raw.isVip" />
                        </div>
                    </template>
                </v-list-item>
            </template>

            <template v-slot:no-data>
                <v-list-item class="EventGuestSearch__no-results">
                    <v-list-item-title class="text-grey">
                        {{ t("EventGuestSearch.noResultsText") }}
                    </v-list-item-title>
                </v-list-item>
            </template>
        </v-autocomplete>
    </div>
</template>

<style lang="scss" scoped>
.EventGuestSearch {
    &__select {
        width: 100%;
    }

    &__option {
        :deep(.v-list-item__content) {
            overflow: visible;
        }
    }

    &__badges {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__no-results {
        pointer-events: none;
    }
}

.v-theme--dark .EventGuestSearch {
    &__arrived-icon {
        background: rgba(var(--v-theme-success), 0.2);
    }
}
</style>
