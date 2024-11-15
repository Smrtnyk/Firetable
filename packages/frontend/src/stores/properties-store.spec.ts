import type { OrganisationDoc, PropertyDoc } from "@firetable/types";
import { DEFAULT_ORGANISATION_SETTINGS, usePropertiesStore } from "./properties-store";
import { mockedStore } from "../../test-helpers/render-component";
import { Role } from "@firetable/types";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, ref } from "vue";

const {
    useFirestoreCollectionSpy,
    createQuerySpy,
    fetchPropertiesForAdminSpy,
    fetchOrganisationsForAdminSpy,
} = vi.hoisted(() => ({
    useFirestoreCollectionSpy: vi.fn(),
    createQuerySpy: vi.fn(),
    fetchPropertiesForAdminSpy: vi.fn(),
    fetchOrganisationsForAdminSpy: vi.fn(),
}));

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreCollection: useFirestoreCollectionSpy,
    createQuery: createQuerySpy,
}));

vi.mock("../backend-proxy", () => ({
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: fetchOrganisationsForAdminSpy,
    propertiesCollection: vi.fn(),
    fetchPropertiesForAdmin: fetchPropertiesForAdminSpy,
}));

vi.mock("firebase/firestore", () => ({
    query: vi.fn(),
    documentId: vi.fn(),
    where: vi.fn(),
}));

function createTestProperty(options: Partial<PropertyDoc> = {}): PropertyDoc {
    return {
        id: "property1",
        name: "Test Property",
        organisationId: "org1",
        settings: {},
        ...options,
    } as PropertyDoc;
}

function createTestOrganisation(options: Partial<OrganisationDoc> = {}): OrganisationDoc {
    return {
        id: "org1",
        name: "Test Organisation",
        settings: {},
        ...options,
    } as OrganisationDoc;
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
                settings: { timezone: "Europe/London", markGuestAsLateAfterMinutes: 10 },
            });
            store.properties = [property];

            const settings = store.getPropertySettingsById("property1");
            expect(settings).toEqual({
                timezone: "Europe/London",
                markGuestAsLateAfterMinutes: 10,
            });
        });

        it("returns default settings when property has no settings", () => {
            const store = mockedStore(usePropertiesStore);
            const property = createTestProperty({ settings: undefined });
            store.properties = [property];

            const settings = store.getPropertySettingsById("property1");
            expect(settings).toEqual({
                timezone: expect.any(String),
                markGuestAsLateAfterMinutes: 10,
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
                    event: {
                        ...DEFAULT_ORGANISATION_SETTINGS.event,
                        eventDurationInHours: 12,
                    },
                },
            });
            store.organisations = [organisation];

            const settings = store.getOrganisationSettingsById("org1");
            expect(settings.event.eventDurationInHours).toBe(12);
            expect(settings.event.eventStartTime24HFormat).toBe("22:00");
            expect(settings.property.propertyCardAspectRatio).toBe("1");
        });

        it("returns default settings when organisation has no settings", () => {
            const store = mockedStore(usePropertiesStore);
            const organisation = createTestOrganisation({ settings: undefined });
            store.organisations = [organisation];

            const settings = store.getOrganisationSettingsById("org1");
            expect(settings).toEqual(
                expect.objectContaining({
                    event: expect.any(Object),
                    property: expect.any(Object),
                    guest: expect.any(Object),
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
                stop: vi.fn(),
                pending: ref(false),
                promise: ref(Promise.resolve()),
            });
            const store = mockedStore(usePropertiesStore);

            await store.initNonAdminProperties({
                role: Role.PROPERTY_OWNER,
                organisationId: "org1",
                relatedProperties: [],
            });

            expect(store.properties).toEqual(properties);
        });

        it("initializes properties for staff with related properties", async () => {
            const store = mockedStore(usePropertiesStore);
            const properties = [createTestProperty()];

            useFirestoreCollectionSpy.mockReturnValue({
                data: ref(properties),
                stop: vi.fn(),
                pending: ref(false),
                promise: ref(Promise.resolve()),
            });

            await store.initNonAdminProperties({
                role: Role.STAFF,
                organisationId: "org1",
                relatedProperties: ["property1"],
            });

            expect(store.properties).toEqual(properties);
        });

        it("sets empty properties for staff with no related properties", async () => {
            const store = mockedStore(usePropertiesStore);

            await store.initNonAdminProperties({
                role: Role.STAFF,
                organisationId: "org1",
                relatedProperties: [],
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
