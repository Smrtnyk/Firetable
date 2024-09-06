import type { PlannedReservationDoc, WalkInReservationDoc } from "@firetable/types";
import { defineStore } from "pinia";

export type AugmentedPlannedReservation = PlannedReservationDoc & { date: number };
export type AugmentedWalkInReservation = WalkInReservationDoc & { date: number };

export interface ReservationBucket {
    propertyName: string;
    propertyId: string;
    plannedReservations: AugmentedPlannedReservation[];
    walkInReservations: AugmentedWalkInReservation[];
}

interface ReservationsState {
    dataCache: Record<string, ReservationBucket[]>;
}

export const useAnalyticsStore = defineStore("analytics", {
    state(): ReservationsState {
        return {
            dataCache: {},
        };
    },
    actions: {
        cacheData(month: string, data: ReservationBucket[]) {
            this.dataCache[month] = data;
        },
        getDataForMonth(month: string): ReservationBucket[] | undefined {
            return this.dataCache[month];
        },
        clearData() {
            this.dataCache = {};
        },
    },
});
