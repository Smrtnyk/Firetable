<script setup lang="ts">
import type { PlannedReservationDoc } from "@firetable/types";

import { matchesProperty } from "es-toolkit/compat";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { computed } from "vue";

interface Props {
    reservations: PlannedReservationDoc[];
}

type Res = Record<string, ReservationObject>;

interface ReservationObject {
    arrived: number;
    name: string;
    reservations: number;
}
type TableData = {
    datasets: any[];
    labels: string[];
};

const headers = [
    { align: "start", key: "name", sortable: true, title: "Name" },
    { align: "start", key: "arrived", sortable: true, title: "Arrived" },
    { align: "start", key: "pending", sortable: true, title: "Pending" },
    { align: "start", key: "total", sortable: true, title: "Total" },
] as const;

const props = defineProps<Props>();

const tableData = computed(function () {
    const { datasets, labels } = generateTableData(props.reservations);
    const arrivedData = datasets.find(matchesProperty("label", "Arrived"))?.data ?? [];
    const pendingData = datasets.find(matchesProperty("label", "Pending"))?.data ?? [];

    return labels.map(function (label, index) {
        const arrived = arrivedData[index] || 0;
        const pending = pendingData[index] || 0;
        return {
            arrived,
            name: label,
            pending,
            total: arrived + pending,
        };
    });
});

function generateTableData(reservations: PlannedReservationDoc[]): TableData {
    const data = reservations.reduce(reservationsReducer, {});
    const labels: string[] = [];
    const arrivedCounts: number[] = [];
    const pendingCounts: number[] = [];

    Object.values(data).forEach(function (entry) {
        labels.push(entry.name);
        arrivedCounts.push(entry.arrived);
        pendingCounts.push(entry.reservations - entry.arrived);
    });

    const pendingDataset = {
        data: pendingCounts,
        label: "Pending",
    };

    const arrivedDataset = {
        data: arrivedCounts,
        label: "Arrived",
    };

    return { datasets: [pendingDataset, arrivedDataset], labels };
}

function reservationsReducer(acc: Res, reservation: PlannedReservationDoc): Res {
    if (!reservation) {
        return acc;
    }
    const { arrived, reservedBy } = reservation;
    const { email, name } = reservedBy;
    const hash = name + email;
    if (acc[hash]) {
        acc[hash].reservations += 1;
    } else {
        acc[hash] = {
            arrived: 0,
            name,
            reservations: 1,
        };
    }
    if (arrived) {
        acc[hash].arrived += 1;
    }
    return acc;
}
</script>

<template>
    <div class="pa-0 ma-0">
        <v-data-table
            v-if="tableData.length > 0"
            :headers="headers"
            :items="tableData"
            item-value="name"
            class="table-container ft-card"
            density="compact"
            :hide-default-footer="true"
            flat
            bordered
        ></v-data-table>

        <FTCenteredText v-else>No reservations yet</FTCenteredText>
    </div>
</template>
