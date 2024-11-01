import type { PlannedReservationDoc, WalkInReservationDoc } from "@firetable/types";
import { defineStore } from "pinia";
import { ref } from "vue";

export type AugmentedPlannedReservation = PlannedReservationDoc & { date: number };
export type AugmentedWalkInReservation = WalkInReservationDoc & { date: number };

export interface ReservationBucket {
    plannedReservations: AugmentedPlannedReservation[];
    walkInReservations: AugmentedWalkInReservation[];
}

type DataCache = {
    [propertyId: string]: {
        [month: string]: ReservationBucket;
    };
};

export const useAnalyticsStore = defineStore("analytics", function () {
    const dataCache = ref<DataCache>({});

    function cacheData(month: string, data: ReservationBucket, propertyId: string): void {
        if (!dataCache.value[propertyId]) {
            dataCache.value[propertyId] = {};
        }
        dataCache.value[propertyId][month] = data;
    }

    function getDataForMonth(month: string, propertyId: string): ReservationBucket | undefined {
        return dataCache.value[propertyId]?.[month];
    }

    function clearData(): void {
        dataCache.value = {};
    }

    return {
        dataCache,
        cacheData,
        getDataForMonth,
        clearData,
    };
});
