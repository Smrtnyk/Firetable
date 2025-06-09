import type { DateRange } from "src/types";

import { ReservationType } from "@firetable/types";
import { createTestingPinia } from "@pinia/testing";
import { noop } from "es-toolkit";
import messages from "src/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type App, createApp, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

import { useReservationsAnalytics } from "./useReservationsAnalytics";

const { fetchAnalyticsDataMock } = vi.hoisted(() => ({
    fetchAnalyticsDataMock: vi.fn(),
}));

vi.mock("src/db", () => ({
    fetchAnalyticsData: fetchAnalyticsDataMock,
}));

function withSetup(
    composable: () => ReturnType<typeof useReservationsAnalytics>,
    initialState = {},
): [ReturnType<typeof useReservationsAnalytics>, App] {
    let result: ReturnType<typeof useReservationsAnalytics>;

    const defaultState = {
        analytics: {
            dataCache: {},
        },
        properties: {
            organisations: [{ id: "1" }],
            properties: [
                {
                    id: "1",
                    name: "Test Property",
                    organisationId: "1",
                    settings: {
                        timezone: "Europe/Vienna",
                    },
                },
            ],
        },
    };

    const testingPinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
            ...defaultState,
            ...initialState,
        },
        stubActions: false,
    });

    const i18n = createI18n({
        fallbackLocale: "en-GB",
        legacy: false,
        locale: "en-GB",
        messages,
    });

    const app = createApp({
        setup() {
            result = composable();
            return noop;
        },
    });

    app.use(testingPinia);
    app.use(i18n);

    const container = document.createElement("div");
    document.body.appendChild(container);
    app.mount(container);

    return [result!, app] as const;
}

describe("useReservationsAnalytics", () => {
    let app: App;
    const FIXED_DATE = new Date("2024-01-15T12:00:00Z");

    beforeEach(() => {
        vi.setSystemTime(FIXED_DATE);
        fetchAnalyticsDataMock.mockReset();
    });

    afterEach(() => {
        vi.useRealTimers();
        app?.unmount();
        document.body.innerHTML = "";
    });

    describe("Data Fetching", () => {
        it("fetches data when date range changes", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [],
                reservations: [],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-01", to: "2024-01-31" });
            app = mountedApp;

            await nextTick();

            expect(fetchAnalyticsDataMock).toHaveBeenCalledWith(
                "2024-01-01",
                "2024-01-31",
                "org1",
                property.value,
            );
            expect(result.reservationBucket.value).toBeDefined();
        });

        it("handles empty data sets gracefully", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [],
                reservations: [],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            expect(result.avgGuestsPerReservation.value.averagePlannedGuests).toBe(0);
            expect(result.avgGuestsPerReservation.value.averageWalkInGuests).toBe(0);
            expect(result.plannedVsWalkInReservations.value[0].value).toBe(0);
            expect(result.peakReservationHours.value[0].data).toEqual([]);
        });

        it("handles empty date range", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "", to: "" });
            app = mountedApp;

            await nextTick();

            expect(fetchAnalyticsDataMock).not.toHaveBeenCalled();
            expect(result.reservationBucket.value).toBeUndefined();
        });

        it("handles API errors gracefully", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockRejectedValueOnce(new Error("Network error"));

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            expect(result.reservationBucket.value).toBeUndefined();
            // Could add more specific error handling tests based on your UI feedback mechanism
        });
    });

    describe("Caching Behavior", () => {
        it("uses cached data when available", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [],
                reservations: [],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            await result.fetchData({ from: "2024-02-28", to: "2024-02-01" });
            await nextTick();

            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            await nextTick();

            expect(fetchAnalyticsDataMock).toHaveBeenCalledTimes(2);
        });

        it("maintains separate caches for different properties", async () => {
            const dateRange: DateRange = { from: "2024-01-31", to: "2024-01-01" };
            const property1 = ref({ id: "1", name: "Property 1", organisationId: "1" });
            const property2 = ref({ id: "2", name: "Property 2", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-15", id: "1", propertyId: "1" }],
                reservations: [{ eventId: "1", id: "1", type: ReservationType.PLANNED }],
            });

            const [result1, mountedApp1] = withSetup(() =>
                useReservationsAnalytics(property1, "org1", "en"),
            );
            await result1.fetchData(dateRange);
            app = mountedApp1;

            await nextTick();

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-15", id: "2", propertyId: "2" }],
                reservations: [
                    { eventId: "2", id: "2", type: ReservationType.PLANNED },
                    { eventId: "2", id: "3", type: ReservationType.PLANNED },
                ],
            });

            const [result2, mountedApp2] = withSetup(() =>
                useReservationsAnalytics(property2, "org1", "en"),
            );
            await result2.fetchData(dateRange);
            app = mountedApp2;

            await nextTick();

            expect(result1.plannedReservationsByActiveProperty.value).toHaveLength(1);
            expect(result2.plannedReservationsByActiveProperty.value).toHaveLength(2);
        });

        it("clears cache on unmount", async () => {
            const dateRange: DateRange = { from: "2024-01-31", to: "2024-01-01" };
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-15", id: "1", propertyId: "1" }],
                reservations: [{ eventId: "1", id: "1", type: ReservationType.PLANNED }],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData(dateRange);
            await nextTick();

            // Unmount the component
            mountedApp.unmount();

            // Create a new instance
            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-15", id: "1", propertyId: "1" }],
                reservations: [{ eventId: "1", id: "1", type: ReservationType.PLANNED }],
            });

            const [result2, newMountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result2.fetchData(dateRange);
            app = newMountedApp;

            await nextTick();

            // Should fetch again as cache was cleared
            expect(fetchAnalyticsDataMock).toHaveBeenCalledTimes(2);
        });
    });

    describe("Computed Analytics", () => {
        it("calculates planned vs walk-in statistics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-01", id: "1", propertyId: "1" }],
                reservations: [
                    { eventId: "1", id: "1", type: ReservationType.PLANNED },
                    { eventId: "1", id: "2", type: ReservationType.PLANNED },
                    { eventId: "1", id: "3", type: ReservationType.WALK_IN },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            expect(result.plannedVsWalkInReservations.value).toHaveLength(2);
            // Planned
            expect(result.plannedVsWalkInReservations.value[0].value).toBe(2);
            // Walk-in
            expect(result.plannedVsWalkInReservations.value[1].value).toBe(1);
        });

        it("calculates peak hours", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-01", id: "1", propertyId: "1" }],
                reservations: [
                    { eventId: "1", time: "19:00", type: ReservationType.PLANNED },
                    { eventId: "1", time: "19:00", type: ReservationType.PLANNED },
                    { eventId: "1", time: "20:00", type: ReservationType.PLANNED },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();
            // 2 at 19:00, 1 at 20:00
            expect(result.peakReservationHours.value[0].data).toEqual([2, 1]);
            expect(result.peakHoursLabels.value).toEqual(["19:00", "20:00"]);
        });

        it("calculates arrived vs no-show statistics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-01", id: "1", propertyId: "1" }],
                reservations: [
                    { arrived: true, eventId: "1", id: "1", type: ReservationType.PLANNED },
                    { arrived: true, eventId: "1", id: "2", type: ReservationType.PLANNED },
                    { arrived: false, eventId: "1", id: "3", type: ReservationType.PLANNED },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            expect(result.plannedArrivedVsNoShow.value[0].value).toBe(2);
            expect(result.plannedArrivedVsNoShow.value[1].value).toBe(1);
        });

        it("calculates consumption analytics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-15", id: "1", propertyId: "1" }],
                reservations: [
                    {
                        arrived: true,
                        consumption: 100,
                        eventId: "1",
                        id: "1",
                        type: ReservationType.PLANNED,
                    },
                    {
                        arrived: true,
                        consumption: 200,
                        eventId: "1",
                        id: "2",
                        type: ReservationType.PLANNED,
                    },
                    {
                        arrived: false,
                        consumption: 300,
                        eventId: "1",
                        id: "3",
                        type: ReservationType.PLANNED,
                    },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            const consumptionData = result.consumptionAnalysisCombined.value;
            // Average total (600/3)
            expect(consumptionData[0].data[0]).toBe(200);
            // Average arrived (300/2)
            expect(consumptionData[1].data[0]).toBe(150);
            // Average pending (300/1)
            expect(consumptionData[2].data[0]).toBe(300);
        });

        it("handles day of week analytics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [
                    // Monday
                    { date: "2024-01-15", id: "1", propertyId: "1" },
                    // Tuesday
                    { date: "2024-01-16", id: "2", propertyId: "1" },
                    // Next Monday
                    { date: "2024-01-22", id: "3", propertyId: "1" },
                ],
                reservations: [
                    { eventId: "1", id: "1", time: "19:00", type: ReservationType.PLANNED },
                    { eventId: "2", id: "2", time: "19:00", type: ReservationType.PLANNED },
                    { eventId: "3", id: "3", time: "19:00", type: ReservationType.PLANNED },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            const mondayIndex = 1;
            const tuesdayIndex = 2;
            // Two Mondays
            expect(result.reservationsByDayOfWeek.value[0].data[mondayIndex]).toBe(2);
            // One Tuesday
            expect(result.reservationsByDayOfWeek.value[0].data[tuesdayIndex]).toBe(1);
        });

        it("correctly associates reservations with their events dates", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            const event1Date = new Date("2024-01-15").getTime();
            const event2Date = new Date("2024-01-16").getTime();

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [
                    { date: event1Date, id: "1", propertyId: "1" },
                    { date: event2Date, id: "2", propertyId: "1" },
                ],
                reservations: [
                    { eventId: "1", id: "1", type: ReservationType.PLANNED },
                    { eventId: "2", id: "2", type: ReservationType.PLANNED },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            const reservations = result.plannedReservationsByActiveProperty.value;
            expect(reservations[0].date).toBe(event1Date);
            expect(reservations[1].date).toBe(event2Date);
        });

        it("handles mixed reservation types for consumption analysis", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ date: "2024-01-01", id: "1", propertyId: "1" }],
                reservations: [
                    // Arrived planned reservation
                    {
                        arrived: true,
                        consumption: 100,
                        eventId: "1",
                        id: "1",
                        type: ReservationType.PLANNED,
                    },
                    // Not arrived planned reservation
                    {
                        arrived: false,
                        consumption: 0,
                        eventId: "1",
                        id: "2",
                        type: ReservationType.PLANNED,
                    },
                    // Walk-in (should not affect consumption stats)
                    { consumption: 200, eventId: "1", id: "3", type: ReservationType.WALK_IN },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ from: "2024-01-31", to: "2024-01-01" });
            app = mountedApp;

            await nextTick();

            const consumptionData = result.consumptionAnalysisCombined.value;
            // Should only consider planned reservations
            // Average total (100/2)
            expect(consumptionData[0].data[0]).toBe(50);
            // Average arrived (100/1)
            expect(consumptionData[1].data[0]).toBe(100);
            // Average pending (0/1)
            expect(consumptionData[2].data[0]).toBe(0);
        });
    });
});
