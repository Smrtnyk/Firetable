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

const tableColumns = [
    { align: "left", field: "name", label: "Name", name: "name", required: true, sortable: true },
    { field: "arrived", label: "Arrived", name: "arrived", sortable: true },
    { field: "pending", label: "Pending", name: "pending", sortable: true },
    { field: "total", label: "Total", name: "total", sortable: true },
] as any;

const props = defineProps<Props>();

const tableData = computed(function () {
    const { datasets, labels } = generateTableData(props.reservations);
    const arrivedData = datasets.find(matchesProperty("label", "Arrived")).data;
    const pendingData = datasets.find(matchesProperty("label", "Pending")).data;

    return labels.map(function (label, index) {
        return {
            arrived: arrivedData[index],
            name: label,
            pending: pendingData[index],
            total: arrivedData[index] + pendingData[index],
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
    <div class="q-pa-none">
        <q-table
            dense
            v-if="tableData.length > 0"
            class="table-container"
            :rows="tableData"
            :columns="tableColumns"
            row-key="name"
            :rows-per-page-options="[0]"
            card-class="ft-card"
            hide-bottom
            flat
            binary-state-sort
            bordered
        ></q-table>

        <FTCenteredText v-else>No reservations yet</FTCenteredText>
    </div>
</template>
