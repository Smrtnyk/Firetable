import type { MockInstance } from "vitest";
import type { EventDoc, PropertyDoc, ReservationDocWithEventId } from "@firetable/types";
import { useReservationsAnalytics } from "./useReservationsAnalytics";
import * as analyticsStore from "../stores/analytics-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationStatus, ReservationType } from "@firetable/types";
import * as backend from "@firetable/backend";
import * as Quasar from "quasar";
import { nextTick, ref } from "vue";

const MOCK_ORG_ID = "mockOrgId";

const villageProperty = createPropertyDoc({ id: "village", name: "Village" });
const prestigeProperty = createPropertyDoc({ id: "prestige", name: "Prestige" });

const mockEventVillage1 = createEventDoc({
    id: "mockEventVillage1",
    name: "Mock Event Village 1",
    propertyId: villageProperty.id,
});
const mockEventPrestige1 = createEventDoc({
    id: "mockEventPrestige1",
    name: "Mock Event Prestige 1",
    propertyId: prestigeProperty.id,
});

const mockReservationVillage1 = createReservationDocWithEventId({
    id: "mockReservationVillage1",
    eventId: mockEventVillage1.id,
});
const mockReservationPrestige1 = createReservationDocWithEventId({
    id: "mockReservationPrestige1",
    eventId: mockEventPrestige1.id,
});

// FIXME: stopped working with latest browser mode
describe.skip("useReservationsAnalytics", () => {
    let fetchAnalyticsDataSpy: MockInstance;

    beforeEach(() => {
        vi.spyOn(Quasar, "Dialog", "get").mockReturnValue({
            create: vi.fn(),
        });
        fetchAnalyticsDataSpy = vi.spyOn(backend, "fetchAnalyticsData").mockResolvedValue({
            reservations: [mockReservationVillage1, mockReservationPrestige1],
            events: [mockEventPrestige1, mockEventVillage1],
        });
        vi.spyOn(analyticsStore, "useAnalyticsStore").mockReturnValue({
            getDataForMonth: vi.fn(),
        } as any);
    });

    it("updates reservation data correctly", async () => {
        const properties = ref([villageProperty, prestigeProperty]);
        const selectedTab = ref(villageProperty.id);

        const { reservationBuckets, plannedVsWalkInReservations } = useReservationsAnalytics(
            properties,
            MOCK_ORG_ID,
            selectedTab,
        );

        await nextTick();
        await new Promise(function (resolve) {
            setTimeout(resolve, 1);
        });

        expect(fetchAnalyticsDataSpy).toHaveBeenCalledWith(
            expect.stringMatching(/202\d-\d\d/),
            MOCK_ORG_ID,
            [villageProperty, prestigeProperty],
        );
        expect(reservationBuckets.value.length).toBe(2);
        expect(plannedVsWalkInReservations.value).toStrictEqual({
            datasets: [
                {
                    backgroundColor: ["#e60049b3", "#0bb4ffb3"],
                    data: [1, 0],
                },
            ],
            labels: ["Planned", "Walk-In"],
        });
    });
});

// Factory functions
function createPropertyDoc(overrides: Partial<PropertyDoc> = {}): PropertyDoc {
    const doc = {
        name: "Default Property",
        organisationId: MOCK_ORG_ID,
        relatedUsers: [],
    };
    return {
        id: "defaultPropertyId",
        ...doc,
        _doc: doc,
        ...overrides,
    };
}

function createEventDoc(overrides: Partial<EventDoc> = {}): EventDoc {
    const doc = {
        name: "Default Event",
        date: Date.now(),
        organisationId: MOCK_ORG_ID,
        creator: "creator",
        entryPrice: 1,
        guestListLimit: 100,
        propertyId: "defaultPropertyId",
    };
    return {
        id: "defaultEventId",
        ...doc,
        _doc: doc,
        ...overrides,
    };
}

function createReservationDocWithEventId(
    overrides: Partial<ReservationDocWithEventId> = {},
): ReservationDocWithEventId {
    const doc = {
        eventId: "defaultEventId",
        tableLabel: "1",
        consumption: 1,
        floorId: "1",
        cancelled: false,
        reservationConfirmed: false,
        arrived: false,
        type: ReservationType.PLANNED,
        time: "12:00",
        status: ReservationStatus.ACTIVE,
        reservedBy: {
            id: "defaultUserId",
            name: "Default User",
            email: "",
        },
    };
    return {
        id: "defaultReservationId",
        ...doc,
        _doc: doc,
        ...overrides,
    };
}
