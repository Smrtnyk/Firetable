import type { AdminUser, AppUser, GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import { useGuestsStore } from "./guests-store";
import { mockedStore } from "../../test-helpers/render-component";
import { Role, ADMIN } from "@firetable/types";
import { setActivePinia, createPinia } from "pinia";
import { vi, describe, it, beforeEach, expect } from "vitest";
import { createApp, ref } from "vue";
import { usePropertiesStore } from "src/stores/properties-store";
import { useAuthStore } from "src/stores/auth-store";

const { useFirestoreCollectionSpy } = vi.hoisted(() => ({
    useFirestoreCollectionSpy: vi.fn(),
}));

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreCollection: useFirestoreCollectionSpy,
    useFirestoreDocument: vi.fn(),
    createQuery: vi.fn(),
}));

// Test helpers and fixtures
type TestStores = {
    guestsStore: ReturnType<typeof useGuestsStore>;
    propertiesStore: ReturnType<typeof usePropertiesStore>;
    authStore: ReturnType<typeof useAuthStore>;
};

function setupTestStores(): TestStores {
    const guestsStore = mockedStore(useGuestsStore);
    const propertiesStore = mockedStore(usePropertiesStore);
    const authStore = mockedStore(useAuthStore) as any;
    return { guestsStore, propertiesStore, authStore };
}

function createTestVisit(options: Partial<Visit> = {}): Visit {
    return {
        arrived: false,
        cancelled: false,
        date: new Date("2023-12-25").getTime(),
        ...options,
    } as Visit;
}

function createTestGuest(options: Partial<GuestDoc> = {}): GuestDoc {
    return {
        id: "guest1",
        name: "Guest 1",
        contact: "+4323524323",
        hashedContact: "hashedContact1",
        maskedContact: "maskedContact1",
        visitedProperties: {},
        ...options,
    } as GuestDoc;
}

function createTestProperty(id: string): PropertyDoc {
    return {
        id,
        name: `Property ${id}`,
    } as PropertyDoc;
}

function mockReturnGuestData(guestData: GuestDoc[]): void {
    useFirestoreCollectionSpy.mockReturnValue({
        data: ref(guestData),
        promise: Promise.resolve(),
    });
}

function setupAuthUser(
    authStore: ReturnType<typeof useAuthStore>,
    role: AppUser["role"] = Role.STAFF,
    properties: string[] = [],
): void {
    authStore.user = {
        relatedProperties: properties,
        role,
    } as AdminUser | AppUser;
}

describe("Guests Store", () => {
    beforeEach(() => {
        const app = createApp({});
        const pinia = createPinia();
        app.use(pinia);
        setActivePinia(pinia);
        mockReturnGuestData([]);
    });

    describe("getGuestByHashedContact", () => {
        it("returns guest from refsMap if available", async () => {
            const { guestsStore } = setupTestStores();
            const guestDoc = createTestGuest();

            mockReturnGuestData([guestDoc]);
            guestsStore.getGuests("org1");

            const result = await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(result).toEqual(guestDoc);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });

        it("returns undefined when guest not found in any cache or Firestore", async () => {
            const { guestsStore } = setupTestStores();
            mockReturnGuestData([]);

            const result = await guestsStore.getGuestByHashedContact("org1", "nonexistent");
            expect(result).toBeUndefined();
        });

        it("caches guest after fetching from Firestore", async () => {
            const { guestsStore } = setupTestStores();
            const guestDoc = createTestGuest();

            mockReturnGuestData([guestDoc]);

            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);

            useFirestoreCollectionSpy.mockClear();

            const cachedResult = await guestsStore.getGuestByHashedContact(
                "org1",
                "hashedContact1",
            );
            expect(cachedResult).toEqual(guestDoc);
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();
        });
    });

    describe("invalidateGuestCache", () => {
        it("removes guest from cache when found", async () => {
            const { guestsStore } = setupTestStores();
            const guestDoc = createTestGuest();

            mockReturnGuestData([guestDoc]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");

            useFirestoreCollectionSpy.mockClear();
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();

            guestsStore.invalidateGuestCache("guest1");

            useFirestoreCollectionSpy.mockClear();
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalled();
        });

        it("does nothing when guest is not found in cache", () => {
            const { guestsStore } = setupTestStores();
            guestsStore.invalidateGuestCache("nonexistent");
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();
        });

        it("only removes the specified guest from cache", async () => {
            const { guestsStore } = setupTestStores();
            const guest1 = createTestGuest();
            const guest2 = createTestGuest({
                id: "guest2",
                hashedContact: "hashedContact2",
            });

            mockReturnGuestData([guest1]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            mockReturnGuestData([guest2]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact2");

            useFirestoreCollectionSpy.mockClear();
            guestsStore.invalidateGuestCache("guest1");

            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);

            await guestsStore.getGuestByHashedContact("org1", "hashedContact2");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getGuests", () => {
        it("returns guests ref for organisationId", () => {
            const { guestsStore } = setupTestStores();
            const result = guestsStore.getGuests("org1");

            expect(result).toBeDefined();
            expect(useFirestoreCollectionSpy).toHaveBeenCalledWith("organisations/org1/guests", {
                wait: true,
            });
        });

        it("caches the refs for the organisationId", () => {
            const { guestsStore } = setupTestStores();

            const result1 = guestsStore.getGuests("org1");
            const result2 = guestsStore.getGuests("org1");

            expect(result1).toBe(result2);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getGuestSummaryForPropertyExcludingEvent", () => {
        beforeEach(() => {
            // Mock current date to be fixed for consistent testing
            vi.setSystemTime(new Date("2024-01-01"));
        });

        it("excludes future visits from the summary", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({
                            arrived: true,
                            date: new Date("2023-12-25").getTime(),
                        }),
                        event2: createTestVisit({ date: new Date("2024-01-15").getTime() }),
                        event3: createTestVisit({
                            arrived: true,
                            date: new Date("2023-12-30").getTime(),
                        }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                fulfilledVisits: 1,
                visitPercentage: "100.00",
            });
        });

        it("returns zeroes when all past visits are excluded and remaining visits are in future", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({
                            arrived: true,
                            date: new Date("2023-12-25").getTime(),
                        }),
                        event2: createTestVisit({ date: new Date("2024-01-15").getTime() }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles visits on current day correctly", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const currentTimestamp = new Date("2024-01-01").getTime();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true, date: currentTimestamp }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                fulfilledVisits: 1,
                visitPercentage: "100.00",
            });
        });

        it("returns guest summary excluding the specified event", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                        event2: createTestVisit(),
                        event3: createTestVisit({ arrived: true, cancelled: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 2,
                fulfilledVisits: 1,
                visitPercentage: "50.00",
            });
        });

        it("returns undefined if guest not found", async () => {
            const { guestsStore } = setupTestStores();
            mockReturnGuestData([]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "nonExistentContact",
                "property1",
                "event2",
            );

            expect(result).toBeUndefined();
        });

        it("returns undefined if user does not have access to the property", async () => {
            const { guestsStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property2: {
                        event1: createTestVisit({ arrived: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property2",
                "event1",
            );

            expect(result).toBeUndefined();
        });

        it("returns undefined if property not found", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            setupAuthUser(authStore, Role.MANAGER, ["property1"]);
            propertiesStore.properties = [];

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toBeUndefined();
        });

        it("returns undefined if no events for the property", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest();

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toBeUndefined();
        });

        it("returns 0 reservations summary if no events after excluding the specified event", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles null events correctly when excluding events", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: null,
                        event2: createTestVisit({ arrived: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );
            // Should not count null events in totals
            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles case when all events are excluded", async () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                },
            });

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });
    });

    describe("guestReservationsSummary", () => {
        it("returns undefined if guest has no visited properties", () => {
            const guestsStore = useGuestsStore();

            const guestDoc = {
                visitedProperties: {},
            } as GuestDoc;

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toBeUndefined();
        });

        it("returns summaries for properties the user has access to", () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                    property2: {
                        event2: createTestVisit(),
                    },
                    property3: {
                        event3: createTestVisit({ arrived: true, cancelled: true }),
                    },
                },
            });

            propertiesStore.properties = [
                createTestProperty("property1"),
                createTestProperty("property2"),
                createTestProperty("property3"),
            ];

            setupAuthUser(authStore, Role.STAFF, ["property1", "property2"]);

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toEqual([
                {
                    propertyId: "property1",
                    propertyName: "Property property1",
                    totalReservations: 1,
                    fulfilledVisits: 1,
                    visitPercentage: "100.00",
                },
                {
                    propertyId: "property2",
                    propertyName: "Property property2",
                    totalReservations: 1,
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("includes all properties when user is admin", () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                    property2: {
                        event2: createTestVisit(),
                    },
                    property3: {
                        event3: createTestVisit({ arrived: true, cancelled: true }),
                    },
                },
            });

            propertiesStore.properties = [
                createTestProperty("property1"),
                createTestProperty("property2"),
                createTestProperty("property3"),
            ];

            setupAuthUser(authStore, ADMIN, []);

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toEqual([
                {
                    propertyId: "property1",
                    propertyName: "Property property1",
                    totalReservations: 1,
                    fulfilledVisits: 1,
                    visitPercentage: "100.00",
                },
                {
                    propertyId: "property2",
                    propertyName: "Property property2",
                    totalReservations: 1,
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
                {
                    propertyId: "property3",
                    propertyName: "Property property3",
                    totalReservations: 1,
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("filters out properties that are not found in propertiesStore", () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                    },
                    property2: {
                        event2: createTestVisit({ arrived: true }),
                    },
                },
            });

            // Only set up one property in the store
            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1", "property2"]);

            const result = guestsStore.guestReservationsSummary(guestDoc);
            expect(result).toHaveLength(1);
            expect(result?.[0]).toEqual({
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                fulfilledVisits: 1,
                visitPercentage: "100.00",
            });
        });

        it("correctly calculates visit percentage with mixed event statuses", () => {
            const { guestsStore, propertiesStore, authStore } = setupTestStores();
            const guestDoc = createTestGuest({
                visitedProperties: {
                    property1: {
                        event1: createTestVisit({ arrived: true }),
                        event2: createTestVisit(),
                        event3: createTestVisit({ arrived: true, cancelled: true }),
                        event4: null,
                    },
                },
            });

            propertiesStore.properties = [createTestProperty("property1")];
            setupAuthUser(authStore, Role.STAFF, ["property1"]);

            const result = guestsStore.guestReservationsSummary(guestDoc);
            expect(result?.[0]).toEqual({
                propertyId: "property1",
                propertyName: "Property property1",
                // Should count 3 events (excluding null)
                totalReservations: 3,
                // Should only count event1 (arrived true, cancelled false)
                fulfilledVisits: 1,
                visitPercentage: "33.33",
            });
        });
    });
});