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
        [dateRange: string]: ReservationBucket;
    };
};

export const useAnalyticsStore = defineStore("analytics", function () {
    const dataCache = ref<DataCache>({});

    function cacheData(dateRangeKey: string, data: ReservationBucket, propertyId: string): void {
        dataCache.value[propertyId] ??= {};
        dataCache.value[propertyId][dateRangeKey] = data;
    }

    function getDataForRange(
        dateRangeKey: string,
        propertyId: string,
    ): ReservationBucket | undefined {
        return dataCache.value[propertyId]?.[dateRangeKey];
    }

    function clearData(): void {
        dataCache.value = {};
    }

    return {
        cacheData,
        clearData,
        dataCache,
        getDataForRange,
    };
});
