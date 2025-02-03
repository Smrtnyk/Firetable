import type { OrganisationDoc, PropertyDoc } from "@firetable/types";

import { Role } from "@firetable/types";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, ref } from "vue";

import { mockedStore } from "../../test-helpers/render-component";
import { DEFAULT_ORGANISATION_SETTINGS, usePropertiesStore } from "./properties-store";

const {
    createQuerySpy,
    fetchOrganisationsForAdminSpy,
    fetchPropertiesForAdminSpy,
    useFirestoreCollectionSpy,
} = vi.hoisted(() => ({
    createQuerySpy: vi.fn(),
    fetchOrganisationsForAdminSpy: vi.fn(),
    fetchPropertiesForAdminSpy: vi.fn(),
    useFirestoreCollectionSpy: vi.fn(),
}));

vi.mock("src/composables/useFirestore", () => ({
    createQuery: createQuerySpy,
    useFirestoreCollection: useFirestoreCollectionSpy,
}));

vi.mock("../backend-proxy", () => ({
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: fetchOrganisationsForAdminSpy,
    fetchPropertiesForAdmin: fetchPropertiesForAdminSpy,
    propertiesCollection: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
    documentId: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

function createTestOrganisation(options: Partial<OrganisationDoc> = {}): OrganisationDoc {
    return {
        id: "org1",
        name: "Test Organisation",
        settings: {},
        ...options,
    } as OrganisationDoc;
}

function createTestProperty(options: Partial<PropertyDoc> = {}): PropertyDoc {
    return {
        id: "property1",
        name: "Test Property",
        organisationId: "org1",
        settings: {},
        ...options,
    } as PropertyDoc;
}

describe("properties-store.ts", () => {
    beforeEach(() => {
        const app = createApp({});
        const pinia = createPinia();
        app.use(pinia);
        setActivePinia(pinia);
    });

    describe("getPropertyById", () => {
        it("returns property when found", () => {
            const store = mockedStore(usePropertiesStore);
            const property = createTestProperty();
            store.properties = [property];

            const result = store.getPropertyById("property1");
            expect(result).toEqual(property);
        });

        it("throws error when property not found", () => {
            const store = mockedStore(usePropertiesStore);
            store.properties = [];

            expect(() => store.getPropertyById("nonexistent")).toThrow(
                "No property found for the given property id",
            );
        });
    });

    describe("getOrganisationById", () => {
        it("returns organisation when found", () => {
            const store = mockedStore(usePropertiesStore);
            const organisation = createTestOrganisation();
            store.organisations = [organisation];

            const result = store.getOrganisationById("org1");
            expect(result).toEqual(organisation);
        });

        it("throws error when organisation not found", () => {
            const store = mockedStore(usePropertiesStore);
            store.organisations = [];

            expect(() => store.getOrganisationById("nonexistent")).toThrow(
                "No organisation found for the given organisation id",
            );
        });
    });

    describe("getPropertySettingsById", () => {
        it("returns merged settings with defaults", () => {
            const store = mockedStore(usePropertiesStore);
            const property = createTestProperty({
                settings: { markGuestAsLateAfterMinutes: 10, timezone: "Europe/London" },
            });
            store.properties = [property];

            const settings = store.getPropertySettingsById("property1");
            expect(settings).toEqual({
                event: {
                    eventCardAspectRatio: "16:9",
                    eventDurationInHours: 10,
                    eventStartTime24HFormat: "22:00",
                    reservationArrivedColor: "#1a7722",
                    reservationCancelledColor: "#ff9f43",
                    reservationConfirmedColor: "#6247aa",
                    reservationPendingColor: "#2ab7ca",
                    reservationWaitingForResponseColor: "#b5a22c",
                },
                guest: {
                    collectGuestData: false,
                    globalGuestTags: [],
                },
                markGuestAsLateAfterMinutes: 10,
                timezone: expect.any(String),
            });
        });

        it("returns default settings when property has no settings", () => {
            const store = mockedStore(usePropertiesStore);
            const property = createTestProperty({ settings: undefined });
            store.properties = [property];

            const settings = store.getPropertySettingsById("property1");
            expect(settings).toEqual({
                event: {
                    eventCardAspectRatio: "16:9",
                    eventDurationInHours: 10,
                    eventStartTime24HFormat: "22:00",
                    reservationArrivedColor: "#1a7722",
                    reservationCancelledColor: "#ff9f43",
                    reservationConfirmedColor: "#6247aa",
                    reservationPendingColor: "#2ab7ca",
                    reservationWaitingForResponseColor: "#b5a22c",
                },
                guest: {
                    collectGuestData: false,
                    globalGuestTags: [],
                },
                markGuestAsLateAfterMinutes: 10,
                timezone: expect.any(String),
            });
        });

        it("throws error when property not found", () => {
            const store = mockedStore(usePropertiesStore);
            store.properties = [];

            expect(() => store.getPropertySettingsById("nonexistent")).toThrow(
                "No property found for the given property id",
            );
        });
    });

    describe("getOrganisationSettingsById", () => {
        it("returns merged settings with defaults", () => {
            const store = mockedStore(usePropertiesStore);
            const organisation = createTestOrganisation({
                settings: {
                    ...DEFAULT_ORGANISATION_SETTINGS,
                    property: {
                        propertyCardAspectRatio: "16:9",
                    },
                },
            });
            store.organisations = [organisation];

            const settings = store.getOrganisationSettingsById("org1");
            expect(settings.property.propertyCardAspectRatio).toBe("16:9");
        });

        it("returns default settings when organisation has no settings", () => {
            const store = mockedStore(usePropertiesStore);
            const organisation = createTestOrganisation({ settings: undefined });
            store.organisations = [organisation];

            const settings = store.getOrganisationSettingsById("org1");
            expect(settings).toEqual(
                expect.objectContaining({
                    property: expect.any(Object),
                }),
            );
        });
    });

    describe("initOrganisations", () => {
        it("successfully initializes organisations", async () => {
            const store = mockedStore(usePropertiesStore);
            const organisations = [createTestOrganisation()];

            fetchOrganisationsForAdminSpy.mockResolvedValue(organisations);

            await store.initOrganisations();

            expect(store.organisations).toEqual(organisations);
        });

        it("handles errors during organisation initialization", async () => {
            const store = mockedStore(usePropertiesStore);
            const error = new Error("Failed to fetch organisations");

            fetchOrganisationsForAdminSpy.mockRejectedValue(error);

            await expect(store.initOrganisations()).rejects.toThrow(error);
        });
    });

    describe("initAdminProperties", () => {
        it("successfully initializes admin properties", async () => {
            const store = mockedStore(usePropertiesStore);
            const properties = [createTestProperty()];
            const organisation = createTestOrganisation();
            fetchPropertiesForAdminSpy.mockResolvedValue(properties);
            store.organisations = [organisation];

            await store.initAdminProperties();

            expect(fetchPropertiesForAdminSpy).toHaveBeenCalledWith([organisation]);
            expect(store.properties).toEqual(properties);
        });

        it("handles errors during admin properties initialization", async () => {
            const store = mockedStore(usePropertiesStore);
            const error = new Error("Failed to fetch properties");

            fetchPropertiesForAdminSpy.mockRejectedValue(error);
            store.organisations = [createTestOrganisation()];

            await expect(store.initAdminProperties()).rejects.toThrow(error);
        });
    });

    describe("initNonAdminProperties", () => {
        it("initializes properties for property owner", async () => {
            const properties = [createTestProperty()];
            useFirestoreCollectionSpy.mockReturnValue({
                data: ref(properties),
                pending: ref(false),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
            });
            const store = mockedStore(usePropertiesStore);

            await store.initNonAdminProperties({
                organisationId: "org1",
                relatedProperties: [],
                role: Role.PROPERTY_OWNER,
            });

            expect(store.properties).toEqual(properties);
        });

        it("initializes properties for staff with related properties", async () => {
            const store = mockedStore(usePropertiesStore);
            const properties = [createTestProperty()];

            useFirestoreCollectionSpy.mockReturnValue({
                data: ref(properties),
                pending: ref(false),
                promise: ref(Promise.resolve()),
                stop: vi.fn(),
            });

            await store.initNonAdminProperties({
                organisationId: "org1",
                relatedProperties: ["property1"],
                role: Role.STAFF,
            });

            expect(store.properties).toEqual(properties);
        });

        it("sets empty properties for staff with no related properties", async () => {
            const store = mockedStore(usePropertiesStore);

            await store.initNonAdminProperties({
                organisationId: "org1",
                relatedProperties: [],
                role: Role.STAFF,
            });

            expect(store.properties).toEqual([]);
        });
    });

    describe("cleanup", () => {
        it("resets store state and unsubscribes from all subscriptions", () => {
            const store = mockedStore(usePropertiesStore);
            const unsubSpy = vi.fn();

            store.properties = [createTestProperty()];
            store.organisations = [createTestOrganisation()];
            store.arePropertiesLoading = true;
            store.unsubs = [unsubSpy];

            store.cleanup();

            expect(store.properties).toEqual([]);
            expect(store.organisations).toEqual([]);
            expect(store.arePropertiesLoading).toBe(false);
            expect(unsubSpy).toHaveBeenCalled();
        });
    });
});
