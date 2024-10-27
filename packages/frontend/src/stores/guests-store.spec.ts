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
    });
});
