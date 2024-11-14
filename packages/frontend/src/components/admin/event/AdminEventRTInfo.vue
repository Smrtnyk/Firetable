<script setup lang="ts">
import type { FloorDoc, ReservationDoc } from "@firetable/types";
import { computed } from "vue";
import { getTablesFromFloorDoc } from "@firetable/floor-creator";
import { property } from "es-toolkit/compat";

interface Props {
    floors: FloorDoc[];
    activeReservations: ReservationDoc[];
    returningGuests: { id: string }[];
}

const props = defineProps<Props>();

function getUniqueFloorNames(floors: FloorDoc[]): Map<string, FloorDoc[]> {
    const floorGroups = new Map<string, FloorDoc[]>();

    floors.forEach((floor) => {
        const baseName = floor.name.replace(/_copy$/, "");
        if (!floorGroups.has(baseName)) {
            floorGroups.set(baseName, []);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just set it
        floorGroups.get(baseName)!.push(floor);
    });

    return floorGroups;
}

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

const reservationsStatus = computed(() => {
    const currentlyOccupied = props.activeReservations.filter(property("arrived")).length;
    const pending = props.activeReservations.length - currentlyOccupied;

    const guestsWithContacts = props.activeReservations.filter(
        ({ guestContact }) => guestContact,
    ).length;
    const vipGuests = props.activeReservations.filter(({ isVIP }) => isVIP).length;

    const totalGuests = props.activeReservations.reduce((acc, reservation) => {
        return acc + Number(reservation.numberOfGuests || 0);
    }, 0);

    const totalConsumption = props.activeReservations.reduce((acc, reservation) => {
        return acc + Number(reservation.consumption || 0);
    }, 0);

    return {
        total: calculateTotalTables(props.floors),
        currentlyOccupied,
        pending,
        totalGuests,
        guestsWithContacts,
        returningGuests: props.returningGuests.length,
        vipGuests,
        averageConsumption: totalConsumption / props.activeReservations.length || 0,
    };
});

const occupancyRate = computed(() => {
    return (
        (reservationsStatus.value.currentlyOccupied / reservationsStatus.value.total) *
        100
    ).toFixed(1);
});

const contactRate = computed(() => {
    return (
        (reservationsStatus.value.guestsWithContacts / reservationsStatus.value.totalGuests) *
        100
    ).toFixed(1);
});
</script>

<template>
    <div class="q-pa-sm">
        <!-- Main Stats Grid -->
        <div class="row q-col-gutter-md">
            <!-- Capacity Section -->
            <div class="col-12 col-md-6">
                <q-card class="bg-primary text-white ft-card">
                    <q-card-section>
                        <div class="text-h6">Capacity Overview</div>
                        <div class="row items-center q-gutter-x-md">
                            <div class="text-h3">{{ occupancyRate }}%</div>
                            <div class="column">
                                <div>
                                    {{ reservationsStatus.currentlyOccupied }} /
                                    {{ reservationsStatus.total }} tables
                                </div>
                                <div>{{ reservationsStatus.pending }} pending</div>
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
                            <div class="text-h3">{{ reservationsStatus.totalGuests }}</div>
                            <div class="column">
                                <div>Total Guests</div>
                                <div>{{ contactRate }}% with contacts</div>
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
                        <div class="text-h5">{{ reservationsStatus.vipGuests }}</div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="text-subtitle2">Returning Guests</div>
                        <div class="text-h5">{{ reservationsStatus.returningGuests }}</div>
                    </q-card-section>
                </q-card>
            </div>

            <div class="col-12 col-md-4">
                <q-card class="ft-card">
                    <q-card-section>
                        <div class="text-subtitle2">Avg. Consumption</div>
                        <div class="text-h5">
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
