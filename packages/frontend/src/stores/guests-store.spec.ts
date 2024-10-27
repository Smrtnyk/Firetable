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

function mockReturnGuestData(guestData: GuestDoc[]): void {
    useFirestoreCollectionSpy.mockReturnValue({
        data: ref(guestData),
        promise: Promise.resolve(),
    });
}

describe("Guests Store", () => {
    beforeEach(() => {
        const pinia = createPinia();
        const app = createApp({});
        app.use(pinia);
        setActivePinia(pinia);

        mockReturnGuestData([]);
    });

    describe("getGuestByHashedContact", () => {
        it("returns guest from refsMap if available", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const guestDoc = {
                id: "guest1",
                hashedContact: "hashedContact1",
                name: "Guest 1",
                visitedProperties: {},
            } as GuestDoc;

            // Set up refsMap with guest data
            useFirestoreCollectionSpy.mockReturnValue({
                data: ref([guestDoc]),
                promise: Promise.resolve(),
            });

            guestsStore.getGuests("org1");

            const result = await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(result).toEqual(guestDoc);
            // Should not make additional Firestore query
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });

        it("returns undefined when guest not found in any cache or Firestore", async () => {
            const guestsStore = mockedStore(useGuestsStore);

            // Empty response from Firestore
            useFirestoreCollectionSpy.mockReturnValue({
                data: ref([]),
                promise: Promise.resolve(),
            });

            const result = await guestsStore.getGuestByHashedContact("org1", "nonexistent");
            expect(result).toBeUndefined();
        });

        it("caches guest after fetching from Firestore", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const guestDoc = {
                id: "guest1",
                hashedContact: "hashedContact1",
                name: "Guest 1",
                visitedProperties: {},
            } as GuestDoc;

            // First call returns from Firestore
            useFirestoreCollectionSpy.mockReturnValue({
                data: ref([guestDoc]),
                promise: Promise.resolve(),
            });

            // First fetch should query Firestore
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);

            // Clear spy to verify second call
            useFirestoreCollectionSpy.mockClear();

            // Second fetch should use cache
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
            const guestsStore = mockedStore(useGuestsStore);
            const guestDoc = {
                id: "guest1",
                hashedContact: "hashedContact1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                visitedProperties: {},
            } as GuestDoc;

            // First, get the guest to populate the cache
            mockReturnGuestData([guestDoc]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");

            // Verify guest is in cache by getting it again (should use cache)
            useFirestoreCollectionSpy.mockClear();
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();

            // Invalidate the cache
            guestsStore.invalidateGuestCache("guest1");

            // Verify guest is removed from cache by getting it again (should query Firestore)
            useFirestoreCollectionSpy.mockClear();
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalled();
        });

        it("does nothing when guest is not found in cache", () => {
            const guestsStore = mockedStore(useGuestsStore);

            // Try to invalidate a non-existent guest
            guestsStore.invalidateGuestCache("nonexistent");

            // Verify the cache remains unchanged
            expect(useFirestoreCollectionSpy).not.toHaveBeenCalled();
        });

        it("only removes the specified guest from cache", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const guest1 = {
                id: "guest1",
                hashedContact: "hashedContact1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                visitedProperties: {},
            } as GuestDoc;
            const guest2 = {
                id: "guest2",
                hashedContact: "hashedContact2",
                name: "Guest 2",
                contact: "+4323524324",
                maskedContact: "maskedContact2",
                visitedProperties: {},
            } as GuestDoc;

            // Populate cache with both guests
            mockReturnGuestData([guest1]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            mockReturnGuestData([guest2]);
            await guestsStore.getGuestByHashedContact("org1", "hashedContact2");

            // Clear spy to start fresh
            useFirestoreCollectionSpy.mockClear();

            // Invalidate only guest1
            guestsStore.invalidateGuestCache("guest1");

            // Verify guest1 is removed (requires Firestore query)
            await guestsStore.getGuestByHashedContact("org1", "hashedContact1");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);

            // Verify guest2 is still in cache (no Firestore query)
            await guestsStore.getGuestByHashedContact("org1", "hashedContact2");
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getGuests", () => {
        it("returns guests ref for organisationId", () => {
            const guestsStore = mockedStore(useGuestsStore);
            const result = guestsStore.getGuests("org1");

            expect(result).toBeDefined();
            expect(useFirestoreCollectionSpy).toHaveBeenCalledWith("organisations/org1/guests", {
                wait: true,
            });
        });

        it("caches the refs for the organisationId", () => {
            const guestsStore = mockedStore(useGuestsStore);

            const result1 = guestsStore.getGuests("org1");
            const result2 = guestsStore.getGuests("org1");

            expect(result1).toBe(result2);
            expect(useFirestoreCollectionSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("getGuestSummaryForPropertyExcludingEvent", () => {
        it("returns guest summary excluding the specified event", async () => {
            const guestDoc = {
                name: "Guest 1",
                contact: "+4323524323",
                hashedContact: "hashedContact1",
                maskedContact: "maskedContact1",
                id: "guest1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                        event2: { arrived: false, cancelled: false } as Visit,
                        event3: { arrived: true, cancelled: true } as Visit,
                    },
                },
            } as GuestDoc;

            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const guestsStore = mockedStore(useGuestsStore);

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [{ id: "property1", name: "Property 1" } as PropertyDoc];
            authStore.user = {
                relatedProperties: ["property1"],
                role: ADMIN,
            } as AdminUser;

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event2",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property 1",
                // event1 and event3
                totalReservations: 2,
                // event1 (arrived and not cancelled)
                fulfilledVisits: 1,
                visitPercentage: "50.00",
            });
        });

        it("returns undefined if guest not found", async () => {
            const guestsStore = mockedStore(useGuestsStore);

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
            const guestDoc: GuestDoc = {
                name: "Guest 1",
                contact: "+4323524323",
                hashedContact: "hashedContact1",
                maskedContact: "maskedContact1",
                id: "guest1",
                visitedProperties: {
                    property2: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            mockReturnGuestData([guestDoc]);
            const authStore = mockedStore(useAuthStore);
            const guestsStore = mockedStore(useGuestsStore);

            // User does not have access to property2
            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property2",
                "event1",
            );

            expect(result).toBeUndefined();
        });

        it("returns undefined if property not found", async () => {
            const guestDoc: GuestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            mockReturnGuestData([guestDoc]);
            const authStore = mockedStore(useAuthStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const guestsStore = mockedStore(useGuestsStore);

            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.MANAGER,
            } as AppUser;
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
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {},
            };

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [{ id: "property1", name: "Property 1" } as PropertyDoc];
            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toBeUndefined();
        });

        it("returns 0 reservations summary if no events after excluding the specified event", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [{ id: "property1", name: "Property 1" } as PropertyDoc];
            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                // Exclude the only event
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property 1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles null events correctly when excluding events", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                contact: "+4323524323",
                hashedContact: "hashedContact1",
                maskedContact: "maskedContact1",
                name: "Guest 1",
                visitedProperties: {
                    property1: {
                        event1: null,
                        event2: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [{ id: "property1", name: "Property 1" }] as PropertyDoc[];

            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

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
                propertyName: "Property 1",
                totalReservations: 0,
                fulfilledVisits: 0,
                visitPercentage: "0.00",
            });
        });

        it("handles case when all events are excluded", async () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                contact: "+4323524323",
                hashedContact: "hashedContact1",
                maskedContact: "maskedContact1",
                name: "Guest 1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            mockReturnGuestData([guestDoc]);
            propertiesStore.properties = [{ id: "property1", name: "Property 1" }] as PropertyDoc[];

            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

            const result = await guestsStore.getGuestSummaryForPropertyExcludingEvent(
                "org1",
                "hashedContact1",
                "property1",
                "event1",
            );

            expect(result).toEqual({
                guestId: "guest1",
                propertyId: "property1",
                propertyName: "Property 1",
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
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                    property2: {
                        event2: { arrived: false, cancelled: false } as Visit,
                    },
                    property3: {
                        event3: { arrived: true, cancelled: true } as Visit,
                    },
                },
            } as GuestDoc;

            propertiesStore.properties = [
                { id: "property1", name: "Property 1" },
                { id: "property2", name: "Property 2" },
                { id: "property3", name: "Property 3" },
            ] as unknown as PropertyDoc[];

            authStore.user = {
                relatedProperties: ["property1", "property2"],
                role: Role.STAFF,
            } as AppUser;

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toEqual([
                {
                    propertyId: "property1",
                    propertyName: "Property 1",
                    totalReservations: 1,
                    fulfilledVisits: 1,
                    visitPercentage: "100.00",
                },
                {
                    propertyId: "property2",
                    propertyName: "Property 2",
                    totalReservations: 1,
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("includes all properties when user is admin", () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                    property2: {
                        event2: { arrived: false, cancelled: false } as Visit,
                    },
                    property3: {
                        event3: { arrived: true, cancelled: true } as Visit,
                    },
                },
            };

            propertiesStore.properties = [
                { id: "property1", name: "Property 1" },
                { id: "property2", name: "Property 2" },
                { id: "property3", name: "Property 3" },
            ] as PropertyDoc[];
            authStore.user = {
                relatedProperties: [],
                role: ADMIN,
            } as unknown as AdminUser;

            const result = guestsStore.guestReservationsSummary(guestDoc);

            expect(result).toEqual([
                {
                    propertyId: "property1",
                    propertyName: "Property 1",
                    totalReservations: 1,
                    fulfilledVisits: 1,
                    visitPercentage: "100.00",
                },
                {
                    propertyId: "property2",
                    propertyName: "Property 2",
                    totalReservations: 1,
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
                {
                    propertyId: "property3",
                    propertyName: "Property 3",
                    totalReservations: 1,
                    // Cancelled visit doesn't count as fulfilled
                    fulfilledVisits: 0,
                    visitPercentage: "0.00",
                },
            ]);
        });

        it("filters out properties that are not found in propertiesStore", () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc: GuestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                    },
                    property2: {
                        event2: { arrived: true, cancelled: false } as Visit,
                    },
                },
            };

            // Only set up one property in the store
            propertiesStore.properties = [{ id: "property1", name: "Property 1" }] as PropertyDoc[];

            authStore.user = {
                relatedProperties: ["property1", "property2"],
                role: Role.STAFF,
            } as AppUser;

            const result = guestsStore.guestReservationsSummary(guestDoc);
            expect(result).toHaveLength(1);
            expect(result?.[0].propertyId).toBe("property1");
        });

        it("correctly calculates visit percentage with mixed event statuses", () => {
            const guestsStore = mockedStore(useGuestsStore);
            const propertiesStore = mockedStore(usePropertiesStore);
            const authStore = mockedStore(useAuthStore);

            const guestDoc = {
                id: "guest1",
                name: "Guest 1",
                contact: "+4323524323",
                maskedContact: "maskedContact1",
                hashedContact: "hashedContact1",
                visitedProperties: {
                    property1: {
                        event1: { arrived: true, cancelled: false } as Visit,
                        event2: { arrived: false, cancelled: false } as Visit,
                        event3: { arrived: true, cancelled: true } as Visit,
                        // Represents a deleted/invalid event
                        event4: null,
                    },
                },
            } as GuestDoc;

            propertiesStore.properties = [{ id: "property1", name: "Property 1" }] as PropertyDoc[];

            authStore.user = {
                relatedProperties: ["property1"],
                role: Role.STAFF,
            } as AppUser;

            const result = guestsStore.guestReservationsSummary(guestDoc);
            expect(result?.[0]).toEqual({
                propertyId: "property1",
                propertyName: "Property 1",
                // Should count 3 events (excluding null)
                totalReservations: 3,
                // Should only count event1 (arrived true, cancelled false)
                fulfilledVisits: 1,
                visitPercentage: "33.33",
            });
        });
    });
});
