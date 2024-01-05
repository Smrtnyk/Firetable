import type { ReservationBucket } from "@firetable/backend";
import { defineStore } from "pinia";

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
