import type { AdminUser, AppUser, GuestDoc, PropertyDoc, Visit } from "@firetable/types";

import { AdminRole, Role } from "@firetable/types";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "src/stores/auth-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, ref } from "vue";

import { mockedStore } from "../../test-helpers/render-component";
import { useGuestsStore } from "./guests-store";

const { createQuerySpy, subscribeToGuestsSpy, useFirestoreCollectionSpy, whereSpy } = vi.hoisted(
    () => ({
        createQuerySpy: vi.fn(),
        subscribeToGuestsSpy: vi.fn(),
        useFirestoreCollectionSpy: vi.fn(),
        whereSpy: vi.fn(),
    }),
);

vi.mock("firebase/firestore", () => ({
    documentId: vi.fn(),
    query: vi.fn(),
    where: whereSpy,
}));

vi.mock("src/composables/useFirestore", () => ({
    createQuery: createQuerySpy,
    useFirestoreCollection: useFirestoreCollectionSpy,
    useFirestoreDocument: vi.fn(),
}));

vi.mock("@firetable/backend", () => ({
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    getGuestsPath: (orgId: string) => `organisations/${orgId}/guests`,
    getUserPath: vi.fn(),
    logoutUser: vi.fn(),
    propertiesCollection: vi.fn(),
    propertiesCollectionPath: vi.fn(),
    subscribeToGuests: subscribeToGuestsSpy,
}));

type TestStores = {
    authStore: ReturnType<typeof useAuthStore>;
    guestsStore: ReturnType<typeof useGuestsStore>;
    propertiesStore: ReturnType<typeof usePropertiesStore>;
};

function createTestGuest(options: Partial<GuestDoc> = {}): GuestDoc {
    return {
        contact: "+4323524323",
        hashedContact: "hashedContact1",
        id: "guest1",
        maskedContact: "maskedContact1",
        name: "Guest 1",
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

function createTestVisit(options: Partial<Visit> = {}): Visit {
    return {
        arrived: false,
        cancelled: false,
        date: new Date("2023-12-25").getTime(),
        ...options,
    } as Visit;
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

function setupTestStores(): TestStores {
    const guestsStore = mockedStore(useGuestsStore);
    const propertiesStore = mockedStore(usePropertiesStore);
    const authStore = mockedStore(useAuthStore) as any;
    return { authStore, guestsStore, propertiesStore };
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

    describe("getGuestsByHashedContacts", () => {
        it("returns empty array for empty input", async () => {
            const { guestsStore } = setupTestStores();
            const result = await guestsStore.getGuestsByHashedContacts("org1", []);
            expect(result).toEqual([]);
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();
        });

        it("returns guests from cache when all are available", async () => {
            const { guestsStore } = setupTestStores();
            const guest1 = createTestGuest();
            const guest2 = createTestGuest({
                hashedContact: "hashedContact2",
                id: "guest2",
            });

            guestsStore.refsMap.set(
                "org1",
                ref({
                    data: [guest1, guest2],
                    pending: false,
                }),
            );

            const result = await guestsStore.getGuestsByHashedContacts("org1", [
                "hashedContact1",
                "hashedContact2",
            ]);

            expect(result).toEqual([guest1, guest2]);
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();
        });

        it("fetches only missing guests when partial cache hit", async () => {
            const { guestsStore } = setupTestStores();
            const guest1 = createTestGuest();
            const guest2 = createTestGuest({
                hashedContact: "hashedContact2",
                id: "guest2",
            });

            // Populate cache with only one guest
            guestsStore.refsMap.set(
                "org1",
                ref({
                    data: [guest1],
                    pending: false,
                }),
            );
            mockReturnGuestData([guest2]);

            const result = await guestsStore.getGuestsByHashedContacts("org1", [
                "hashedContact1",
                "hashedContact2",
            ]);

            expect(result).toEqual([guest1, guest2]);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledWith(
                // mockQuery spy returns undefined, so we can't check the query directly
                undefined,
                {
                    once: true,
                    wait: true,
                },
            );
            expect(createQuerySpy).toHaveBeenCalledTimes(1);
            expect(whereSpy).toHaveBeenCalledWith("hashedContact", "in", ["hashedContact2"]);
        });

        it("handles empty results for non-existent contacts", async () => {
            const { guestsStore } = setupTestStores();
            mockReturnGuestData([]);

            const result = await guestsStore.getGuestsByHashedContacts("org1", [
                "nonexistent1",
                "nonexistent2",
            ]);

            expect(result).toEqual([]);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });

        it("chunks large contact arrays into multiple queries", async () => {
            const { guestsStore } = setupTestStores();
            const contacts = Array.from({ length: 35 }, (_, i) => `hashedContact${i}`);

            mockReturnGuestData([]);

            await guestsStore.getGuestsByHashedContacts("org1", contacts);

            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(2);
            expect(whereSpy).toHaveBeenNthCalledWith(
                1,
                "hashedContact",
                "in",
                expect.arrayContaining(contacts.slice(0, 30)),
            );
            expect(whereSpy).toHaveBeenNthCalledWith(
                2,
                "hashedContact",
                "in",
                expect.arrayContaining(contacts.slice(30)),
            );
        });

        it("handles cache invalidation correctly", async () => {
            const { guestsStore } = setupTestStores();
            const guest = createTestGuest();

            mockReturnGuestData([guest]);
            // 1st fetch
            await guestsStore.getGuestsByHashedContacts("org1", ["hashedContact1"]);

            guestsStore.invalidateGuestCache(guest.id);

            // 2nd fetch
            await guestsStore.getGuestsByHashedContacts("org1", ["hashedContact1"]);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(2);
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
                hashedContact: "hashedContact2",
                id: "guest2",
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

            expect(result.value).toEqual({
                data: [],
                pending: true,
            });
            expect(subscribeToGuestsSpy).toHaveBeenCalledWith("org1", expect.any(Object));
        });

        it("caches the refs for the organisationId", () => {
            const { guestsStore } = setupTestStores();

            const result1 = guestsStore.getGuests("org1");
            const result2 = guestsStore.getGuests("org1");

            expect(result1).toStrictEqual(result2);
            expect(subscribeToGuestsSpy).toHaveBeenCalledTimes(1);
        });

        it("creates new subscription after cleanup", () => {
            const { guestsStore } = setupTestStores();
            const unsubscribe = vi.fn();
            subscribeToGuestsSpy.mockReturnValue(unsubscribe);

            // First call
            const result1 = guestsStore.getGuests("org1");
            expect(subscribeToGuestsSpy).toHaveBeenCalledTimes(1);

            // Cleanup subscriptions
            guestsStore.cleanup();
            expect(unsubscribe).toHaveBeenCalled();

            // Second call should create new subscription
            const result2 = guestsStore.getGuests("org1");
            expect(subscribeToGuestsSpy).toHaveBeenCalledTimes(2);
            expect(result2).not.toBe(result1);
        });

        it("handles subscription callbacks correctly", () => {
            const { guestsStore } = setupTestStores();
            const guestDoc = createTestGuest();

            const result = guestsStore.getGuests("org1");
            expect(result.value.pending).toBe(true);

            // Get the callbacks that were passed to subscribeToGuests
            const callbacks = subscribeToGuestsSpy.mock.calls[0][1];

            callbacks.onAdd(guestDoc);
            expect(result.value).toEqual({
                data: [guestDoc],
                pending: true,
            });

            const modifiedGuest = { ...guestDoc, name: "Modified Name" };
            callbacks.onModify(modifiedGuest);
            expect(result.value).toEqual({
                data: [modifiedGuest],
                pending: true,
            });

            callbacks.onRemove(guestDoc.id);
            expect(result.value).toEqual({
                data: [],
                pending: true,
            });

            const error = new Error("Test error");
            callbacks.onError(error);
            expect(result.value.pending).toBe(false);

            callbacks.onReady();
            expect(result.value.pending).toBe(false);
        });

        it("maintains guest cache through subscription updates", async () => {
            const { guestsStore } = setupTestStores();
            const guestDoc = createTestGuest();

            guestsStore.getGuests("org1");
            const callbacks = subscribeToGuestsSpy.mock.calls[0][1];

            // Add guest through subscription
            callbacks.onAdd(guestDoc);

            // Check if guest is cached
            await expect(
                guestsStore.getGuestByHashedContact("org1", guestDoc.hashedContact),
            ).resolves.toEqual(guestDoc);

            // Modify guest through subscription
            const modifiedGuest = { ...guestDoc, name: "Modified Name" };
            callbacks.onModify(modifiedGuest);

            // Check if cache is updated
            await expect(
                guestsStore.getGuestByHashedContact("org1", modifiedGuest.hashedContact),
            ).resolves.toEqual(modifiedGuest);
        });

        it("cleans up subscriptions correctly", () => {
            const { guestsStore } = setupTestStores();
            const unsubscribe = vi.fn();
            subscribeToGuestsSpy.mockReturnValue(unsubscribe);
            guestsStore.getGuests("org1");
            guestsStore.getGuests("org2");
            guestsStore.cleanup();

            expect(unsubscribe).toHaveBeenCalledTimes(2);
        });
    });

    describe("getGuestSummaryForPropertyExcludingEvent", () => {
        beforeEach(() => {
            // for consistent testing
            vi.setSystemTime(new Date("2024-01-01"));
        });

        it("excludes future visits from the summary", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            setupAuthUser(authStore, AdminRole.ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                fulfilledVisits: 1,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                visitPercentage: "100.00",
            });
        });

        it("returns zeroes when all past visits are excluded and remaining visits are in future", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            setupAuthUser(authStore, AdminRole.ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                fulfilledVisits: 0,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles visits on current day correctly", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            setupAuthUser(authStore, AdminRole.ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );

            expect(result).toEqual({
                fulfilledVisits: 1,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                visitPercentage: "100.00",
            });
        });

        it("returns guest summary excluding the specified event", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            setupAuthUser(authStore, AdminRole.ADMIN, ["property1"]);

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );

            expect(result).toEqual({
                fulfilledVisits: 1,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 2,
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
            const { authStore, guestsStore } = setupTestStores();
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
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                fulfilledVisits: 0,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles null events correctly when excluding events", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                fulfilledVisits: 0,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles case when all events are excluded", async () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                fulfilledVisits: 0,
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 0,
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
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                    fulfilledVisits: 1,
                    propertyId: "property1",
                    propertyName: "Property property1",
                    totalReservations: 1,
                    visitPercentage: "100.00",
                },
                {
                    fulfilledVisits: 0,
                    propertyId: "property2",
                    propertyName: "Property property2",
                    totalReservations: 1,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("includes all properties when user is admin", () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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

            setupAuthUser(authStore, AdminRole.ADMIN, []);

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toEqual([
                {
                    fulfilledVisits: 1,
                    propertyId: "property1",
                    propertyName: "Property property1",
                    totalReservations: 1,
                    visitPercentage: "100.00",
                },
                {
                    fulfilledVisits: 0,
                    propertyId: "property2",
                    propertyName: "Property property2",
                    totalReservations: 1,
                    visitPercentage: "0.00",
                },
                {
                    fulfilledVisits: 0,
                    propertyId: "property3",
                    propertyName: "Property property3",
                    totalReservations: 1,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("filters out properties that are not found in propertiesStore", () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                fulfilledVisits: 1,
                propertyId: "property1",
                propertyName: "Property property1",
                totalReservations: 1,
                visitPercentage: "100.00",
            });
        });

        it("correctly calculates visit percentage with mixed event statuses", () => {
            const { authStore, guestsStore, propertiesStore } = setupTestStores();
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
                // Should only count event1 (arrived true, cancelled false)
                fulfilledVisits: 1,
                propertyId: "property1",
                propertyName: "Property property1",
                // Should count 3 events (excluding null)
                totalReservations: 3,
                visitPercentage: "33.33",
            });
        });
    });
});
