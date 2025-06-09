<script setup lang="ts">
import type { FloorDoc, ReservationDoc } from "@firetable/types";

import { getTablesFromFloorDoc } from "@firetable/floor-creator";
import { property } from "es-toolkit/compat";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

export interface AdminEventRTInfoProps {
    activeReservations: ReservationDoc[];
    floors: FloorDoc[];
    returningGuests: { id: string }[];
}

const props = defineProps<AdminEventRTInfoProps>();

function calculateTotalTables(floors: FloorDoc[]): number {
    const floorGroups = getUniqueFloorNames(floors);
    let totalTables = 0;

    floorGroups.forEach(function (groupedFloors) {
        const mainFloor =
            groupedFloors.find(function (floor) {
                return !floor.name.endsWith("_copy");
            }) ?? groupedFloors[0];
        totalTables += getTablesFromFloorDoc(mainFloor).length;
    });

    return totalTables;
}

function getUniqueFloorNames(floors: FloorDoc[]): Map<string, FloorDoc[]> {
    const floorGroups = new Map<string, FloorDoc[]>();

    floors.forEach(function (floor) {
        const baseName = floor.name.replace(/_copy$/, "");
        if (!floorGroups.has(baseName)) {
            floorGroups.set(baseName, []);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just set it
        floorGroups.get(baseName)!.push(floor);
    });

    return floorGroups;
}

const reservationsStatus = computed(function () {
    const currentlyOccupied = props.activeReservations
        .map(property("arrived"))
        .filter(Boolean).length;
    const pending = props.activeReservations.length - currentlyOccupied;

    const guestsWithContacts = props.activeReservations
        .map(property("guestContact"))
        .filter(Boolean).length;
    const vipGuests = props.activeReservations.map(property("isVIP")).filter(Boolean).length;

    const totalGuests = props.activeReservations.reduce(function (acc, reservation) {
        return acc + Number(reservation.numberOfGuests || 0);
    }, 0);

    const totalConsumption = props.activeReservations.reduce(function (acc, reservation) {
        return acc + Number(reservation.consumption || 0);
    }, 0);

    return {
        averageConsumption: totalConsumption / props.activeReservations.length || 0,
        currentlyOccupied,
        guestsWithContacts,
        pending,
        returningGuests: props.returningGuests.length,
        total: calculateTotalTables(props.floors),
        totalGuests,
        vipGuests,
    };
});

const occupancyRate = computed(function () {
    // If total is 0, return 0 rate to avoid division by zero
    if (reservationsStatus.value.total === 0) {
        return "0.0";
    }
    return (
        (reservationsStatus.value.currentlyOccupied / reservationsStatus.value.total) *
        100
    ).toFixed(1);
});

const contactRate = computed(function () {
    return (
        (reservationsStatus.value.guestsWithContacts / reservationsStatus.value.totalGuests) *
        100
    ).toFixed(1);
});

const { t } = useI18n();
</script>

<template>
    <div class="pa-4 ma-0">
        <!-- Main Stats Grid -->
        <v-row>
            <!-- Capacity Section -->
            <v-col cols="12" md="6">
                <v-card color="primary" class="text-white ft-card">
                    <v-card-text>
                        <div class="text-h6">
                            {{ t("AdminEventRTInfo.titles.capacityOverview") }}
                        </div>
                        <div class="d-flex align-center ga-4">
                            <div class="text-h3" aria-label="occupancy rate">
                                {{ occupancyRate }}%
                            </div>
                            <div class="d-flex flex-column">
                                <div aria-label="tables occupied">
                                    {{ reservationsStatus.currentlyOccupied }} /
                                    {{ reservationsStatus.total }}
                                    {{ t("AdminEventRTInfo.labels.tables") }}
                                </div>
                                <div aria-label="pending reservations">
                                    {{ reservationsStatus.pending }}
                                    {{ t("AdminEventRTInfo.labels.pending") }}
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Guests Section -->
            <v-col cols="12" md="6">
                <v-card color="secondary" class="text-white ft-card">
                    <v-card-text>
                        <div class="text-h6">
                            {{ t("AdminEventRTInfo.titles.guestStatistics") }}
                        </div>
                        <div class="d-flex align-center ga-4">
                            <div class="text-h3" aria-label="total guests">
                                {{ reservationsStatus.totalGuests }}
                            </div>
                            <div class="d-flex flex-column">
                                <div>{{ t("AdminEventRTInfo.labels.totalGuests") }}</div>
                                <div aria-label="guest contact rate">
                                    {{ contactRate }}%
                                    {{ t("AdminEventRTInfo.labels.withContactsSuffix") }}
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Additional Metrics -->
            <v-col cols="12" md="4">
                <v-card class="ft-card">
                    <v-card-text>
                        <div class="text-subtitle-2">
                            {{ t("AdminEventRTInfo.labels.vipGuests") }}
                        </div>
                        <div class="text-h5" aria-label="vip guest count">
                            {{ reservationsStatus.vipGuests }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card class="ft-card">
                    <v-card-text>
                        <div class="text-subtitle-2">
                            {{ t("AdminEventRTInfo.labels.returningGuests") }}
                        </div>
                        <div class="text-h5" aria-label="returning guest count">
                            {{ reservationsStatus.returningGuests }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card class="ft-card">
                    <v-card-text>
                        <div class="text-subtitle-2">
                            {{ t("AdminEventRTInfo.labels.avgConsumption") }}
                        </div>
                        <div class="text-h5" aria-label="average consumption">
                            {{ reservationsStatus.averageConsumption.toFixed(2) }}
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>
.v-card {
    transition: transform 0.2s;
}

.v-card:hover {
    transform: translateY(-2px);
}
</style>
