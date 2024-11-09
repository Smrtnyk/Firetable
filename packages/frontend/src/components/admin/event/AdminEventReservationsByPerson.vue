<script setup lang="ts">
import type { PlannedReservationDoc } from "@firetable/types";
import { computed } from "vue";
import { matchesProperty } from "es-toolkit/compat";
import FTCenteredText from "src/components/FTCenteredText.vue";

interface Props {
    reservations: PlannedReservationDoc[];
}

interface ReservationObject {
    name: string;
    reservations: number;
    arrived: number;
}

type Res = Record<string, ReservationObject>;
type TableData = {
    labels: string[];
    datasets: any[];
};

const tableColumns = [
    { name: "name", required: true, label: "Name", align: "left", field: "name", sortable: true },
    { name: "arrived", label: "Arrived", field: "arrived", sortable: true },
    { name: "pending", label: "Pending", field: "pending", sortable: true },
    { name: "total", label: "Total", field: "total", sortable: true },
] as any;

const props = defineProps<Props>();

const tableData = computed(function () {
    const { labels, datasets } = generateTableData(props.reservations);
    const arrivedData = datasets.find(matchesProperty("label", "Arrived")).data;
    const pendingData = datasets.find(matchesProperty("label", "Pending")).data;

    return labels.map(function (label, index) {
        return {
            name: label,
            arrived: arrivedData[index],
            pending: pendingData[index],
            total: arrivedData[index] + pendingData[index],
        };
    });
});

function reservationsReducer(acc: Res, reservation: PlannedReservationDoc): Res {
    if (!reservation) {
        return acc;
    }
    const { reservedBy, arrived } = reservation;
    const { email, name } = reservedBy;
    const hash = name + email;
    if (acc[hash]) {
        acc[hash].reservations += 1;
    } else {
        acc[hash] = {
            name,
            reservations: 1,
            arrived: 0,
        };
    }
    if (arrived) {
        acc[hash].arrived += 1;
    }
    return acc;
}

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
        label: "Pending",
        data: pendingCounts,
    };

    const arrivedDataset = {
        label: "Arrived",
        data: arrivedCounts,
    };

    return { labels, datasets: [pendingDataset, arrivedDataset] };
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
