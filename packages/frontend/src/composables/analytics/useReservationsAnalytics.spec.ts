import { useReservationsAnalytics } from "./useReservationsAnalytics";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ref, createApp, type App, nextTick } from "vue";
import { createTestingPinia } from "@pinia/testing";
import { createI18n } from "vue-i18n";
import messages from "src/i18n";
import { noop } from "es-toolkit";
import { ReservationType } from "@firetable/types";
import { Quasar, Loading, Dialog } from "quasar";

const { fetchAnalyticsDataMock } = vi.hoisted(() => ({
    fetchAnalyticsDataMock: vi.fn(),
}));

vi.mock("../../backend-proxy", () => ({
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
            organisations: [{ id: "1" }],
        },
    };

    const testingPinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
            ...defaultState,
            ...initialState,
        },
    });

    const i18n = createI18n({
        locale: "en-GB",
        fallbackLocale: "en-GB",
        messages,
        legacy: false,
    });

    const app = createApp({
        setup() {
            result = composable();
            return noop;
        },
    });

    app.use(testingPinia);
    app.use(i18n);
    app.use(Quasar, { plugins: { Loading, Dialog } });

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
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
            await result.fetchData({ startDate: "", endDate: "" });
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
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
            app = mountedApp;

            await nextTick();

            await result.fetchData({ startDate: "2024-02-01", endDate: "2024-02-28" });
            await nextTick();

            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
            await nextTick();

            expect(fetchAnalyticsDataMock).toHaveBeenCalledTimes(2);
        });

        it("maintains separate caches for different properties", async () => {
            const dateRange = { startDate: "2024-01-01", endDate: "2024-01-31" };
            const property1 = ref({ id: "1", name: "Property 1", organisationId: "1" });
            const property2 = ref({ id: "2", name: "Property 2", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "1", propertyId: "1", date: "2024-01-15" }],
                reservations: [{ type: ReservationType.PLANNED, id: "1", eventId: "1" }],
            });

            const [result1, mountedApp1] = withSetup(() =>
                useReservationsAnalytics(property1, "org1", "en"),
            );
            await result1.fetchData(dateRange);
            app = mountedApp1;

            await nextTick();

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "2", propertyId: "2", date: "2024-01-15" }],
                reservations: [
                    { type: ReservationType.PLANNED, id: "2", eventId: "2" },
                    { type: ReservationType.PLANNED, id: "3", eventId: "2" },
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
            const dateRange = { startDate: "2024-01-01", endDate: "2024-01-31" };
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "1", propertyId: "1", date: "2024-01-15" }],
                reservations: [{ type: ReservationType.PLANNED, id: "1", eventId: "1" }],
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
                events: [{ id: "1", propertyId: "1", date: "2024-01-15" }],
                reservations: [{ type: ReservationType.PLANNED, id: "1", eventId: "1" }],
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
                events: [{ id: "1", propertyId: "1", date: "2024-01-01" }],
                reservations: [
                    { type: ReservationType.PLANNED, id: "1", eventId: "1" },
                    { type: ReservationType.PLANNED, id: "2", eventId: "1" },
                    { type: ReservationType.WALK_IN, id: "3", eventId: "1" },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
                events: [{ id: "1", propertyId: "1", date: "2024-01-01" }],
                reservations: [
                    { time: "19:00", type: ReservationType.PLANNED, eventId: "1" },
                    { time: "19:00", type: ReservationType.PLANNED, eventId: "1" },
                    { time: "20:00", type: ReservationType.PLANNED, eventId: "1" },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
            app = mountedApp;

            await nextTick();
            // 2 at 19:00, 1 at 20:00
            expect(result.peakReservationHours.value[0].data).toEqual([2, 1]);
            expect(result.peakHoursLabels.value).toEqual(["19:00", "20:00"]);
        });

        it("calculates arrived vs no-show statistics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "1", propertyId: "1", date: "2024-01-01" }],
                reservations: [
                    { type: ReservationType.PLANNED, id: "1", eventId: "1", arrived: true },
                    { type: ReservationType.PLANNED, id: "2", eventId: "1", arrived: true },
                    { type: ReservationType.PLANNED, id: "3", eventId: "1", arrived: false },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
            app = mountedApp;

            await nextTick();

            expect(result.plannedArrivedVsNoShow.value[0].value).toBe(2);
            expect(result.plannedArrivedVsNoShow.value[1].value).toBe(1);
        });

        it("calculates consumption analytics", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "1", propertyId: "1", date: "2024-01-15" }],
                reservations: [
                    {
                        type: ReservationType.PLANNED,
                        id: "1",
                        eventId: "1",
                        consumption: 100,
                        arrived: true,
                    },
                    {
                        type: ReservationType.PLANNED,
                        id: "2",
                        eventId: "1",
                        consumption: 200,
                        arrived: true,
                    },
                    {
                        type: ReservationType.PLANNED,
                        id: "3",
                        eventId: "1",
                        consumption: 300,
                        arrived: false,
                    },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
                    { id: "1", propertyId: "1", date: "2024-01-15" },
                    // Tuesday
                    { id: "2", propertyId: "1", date: "2024-01-16" },
                    // Next Monday
                    { id: "3", propertyId: "1", date: "2024-01-22" },
                ],
                reservations: [
                    { type: ReservationType.PLANNED, id: "1", eventId: "1", time: "19:00" },
                    { type: ReservationType.PLANNED, id: "2", eventId: "2", time: "19:00" },
                    { type: ReservationType.PLANNED, id: "3", eventId: "3", time: "19:00" },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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
                    { id: "1", propertyId: "1", date: event1Date },
                    { id: "2", propertyId: "1", date: event2Date },
                ],
                reservations: [
                    { type: ReservationType.PLANNED, id: "1", eventId: "1" },
                    { type: ReservationType.PLANNED, id: "2", eventId: "2" },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
            app = mountedApp;

            await nextTick();

            const reservations = result.plannedReservationsByActiveProperty.value;
            expect(reservations[0].date).toBe(event1Date);
            expect(reservations[1].date).toBe(event2Date);
        });

        it("handles mixed reservation types for consumption analysis", async () => {
            const property = ref({ id: "1", name: "Test Property", organisationId: "1" });

            fetchAnalyticsDataMock.mockResolvedValueOnce({
                events: [{ id: "1", propertyId: "1", date: "2024-01-01" }],
                reservations: [
                    // Arrived planned reservation
                    {
                        type: ReservationType.PLANNED,
                        id: "1",
                        eventId: "1",
                        consumption: 100,
                        arrived: true,
                    },
                    // Not arrived planned reservation
                    {
                        type: ReservationType.PLANNED,
                        id: "2",
                        eventId: "1",
                        consumption: 0,
                        arrived: false,
                    },
                    // Walk-in (should not affect consumption stats)
                    { type: ReservationType.WALK_IN, id: "3", eventId: "1", consumption: 200 },
                ],
            });

            const [result, mountedApp] = withSetup(() =>
                useReservationsAnalytics(property, "org1", "en"),
            );
            await result.fetchData({ startDate: "2024-01-01", endDate: "2024-01-31" });
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