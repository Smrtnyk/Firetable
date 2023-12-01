import { defineStore } from "pinia";

import { ReservationDoc } from "@firetable/types";

export type AugmentedReservation = ReservationDoc & { date: number };

export interface ReservationBucket {
    propertyName: string;
    propertyId: string;
    reservations: AugmentedReservation[];
}

interface ReservationsState {
    dataCache: Record<string, ReservationBucket[]>;
}

export const useAnalyticsStore = defineStore("analytics", {
    state: (): ReservationsState => ({
        dataCache: {},
    }),
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
