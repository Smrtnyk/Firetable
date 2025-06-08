<script setup lang="ts">
import type { FloorDoc, ReservationDoc } from "@firetable/types";

import { getTablesFromFloorDoc } from "@firetable/floor-creator";
import { property } from "es-toolkit/compat";
import { computed } from "vue";

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
</script>

<template>
    <div class="q-pa-sm q-ma-none">
        <!-- Main Stats Grid -->
        <div class="row q-col-gutter-md">
            <!-- Capacity Section -->
            <div class="col-12 col-md-6">
                <q-card class="bg-primary text-white ft-card">
                    <q-card-section>
                        <div class="text-h6">Capacity Overview</div>
                        <div class="row items-center q-gutter-x-md">
                            <div class="text-h3" aria-label="occupancy rate">
                                {{ occupancyRate }}%
                            </div>
                            <div class="column">
                                <div aria-label="tables occupied">
                                    {{ reservationsStatus.currentlyOccupied }} /
                                    {{ reservationsStatus.total }} tables
                                </div>
                                <div aria-label="pending reservations">
                                    {{ reservationsStatus.pending }} pending
                                </div>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Guests Section -->
            <div class="col-12 col-md-6">
                <q-card class="bg-secondary text-white ft-card">
                    <q-card-section>
                        <div class="text-h6">Guest Statistics</div>
                        <div class="row items-center q-gutter-x-md">
                            <div class="text-h3" aria-label="total guests">
                                {{ reservationsStatus.totalGuests }}
                            </div>
                            <div class="column">
                                <div>Total Guests</div>
                                <div aria-label="guest contact rate">
                                    {{ contactRate }}% with contacts
                                </div>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Additional Metrics -->
            <div class="col-12 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="text-subtitle2">VIP Guests</div>
                        <div class="text-h5" aria-label="vip guest count">
                            {{ reservationsStatus.vipGuests }}
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="text-subtitle2">Returning Guests</div>
                        <div class="text-h5" aria-label="returning guest count">
                            {{ reservationsStatus.returningGuests }}
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="text-subtitle2">Avg. Consumption</div>
                        <div class="text-h5" aria-label="average consumption">
                            {{ reservationsStatus.averageConsumption.toFixed(2) }}
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.q-card {
    transition: transform 0.2s;
}

.q-card:hover {
    transform: translateY(-2px);
}
</style>
