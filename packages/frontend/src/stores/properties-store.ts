import type {
    OrganisationDoc,
    OrganisationSettings,
    PropertyDoc,
    User,
    DeepRequired,
} from "@firetable/types";
import type { NOOP } from "@firetable/utils";
import { Role } from "@firetable/types";
import { defineStore } from "pinia";
import {
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    fetchPropertiesForAdmin,
    propertiesCollection,
} from "@firetable/backend";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { query, where } from "firebase/firestore";
import { nextTick, ref, watch } from "vue";
import { deepMerge } from "@firetable/utils";

export const DEFAULT_ORGANISATION_SETTINGS: DeepRequired<OrganisationSettings> = {
    event: {
        eventStartTime24HFormat: "22:00",
        eventDurationInHours: 10,
        eventCardAspectRatio: "16:9",
        reservationArrivedColor: "#1a7722",
        reservationConfirmedColor: "#6247aa",
        reservationCancelledColor: "#ff9f43",
        reservationPendingColor: "#2ab7ca",
    },
    property: {
        propertyCardAspectRatio: "1",
    },
    guest: {
        collectGuestData: false,
    },
};

export const usePropertiesStore = defineStore("properties", () => {
    const properties = ref<PropertyDoc[]>([]);
    const arePropertiesLoading = ref(false);
    const organisations = ref<OrganisationDoc[]>([]);
    const unsubs = ref<(typeof NOOP)[]>([]);

    function cleanup(): void {
        for (const unsub of unsubs.value) {
            unsub();
        }
        properties.value = [];
        organisations.value = [];
        arePropertiesLoading.value = false;
    }

    function getOrganisationById(organisationId: string): OrganisationDoc | undefined {
        return organisations.value.find((organisation) => {
            return organisation.id === organisationId;
        });
    }

    function getOrganisationNameById(organisationId: string): string {
        return (
            organisations.value.find((organisation) => {
                return organisation.id === organisationId;
            })?.name ?? ""
        );
    }

    function getPropertyNameById(propertyId: string): string {
        return properties.value.find(({ id }) => id === propertyId)?.name ?? "";
    }

    function getOrganisationSettingsById(organisationId: string): OrganisationSettings {
        const settings =
            organisations.value.find((organisation) => {
                return organisation.id === organisationId;
            })?.settings ?? {};
        return deepMerge(DEFAULT_ORGANISATION_SETTINGS, settings);
    }

    function getPropertiesByOrganisationId(organisationId: string): PropertyDoc[] {
        return properties.value.filter(({ organisationId: orgId }) => orgId === organisationId);
    }

    async function initOrganisations(): Promise<void> {
        const organisationsData = await fetchOrganisationsForAdmin();
        setOrganisations(organisationsData);
    }

    async function initAdminProperties(): Promise<void> {
        const allProperties = await fetchPropertiesForAdmin(organisations.value);
        setProperties(allProperties);
    }

    function addUnsub(unsub: typeof NOOP): void {
        unsubs.value.push(unsub);
    }

    function setProperties(newProperties: PropertyDoc[]): void {
        properties.value = newProperties;
    }

    function setArePropertiesLoading(loading: boolean): void {
        arePropertiesLoading.value = loading;
    }

    function setOrganisations(organisationsVal: OrganisationDoc[]): void {
        organisations.value = organisationsVal;
    }

    async function initUserOrganisation(organisationId: string): Promise<void> {
        const organisationsDoc = await fetchOrganisationById(organisationId);
        if (!organisationsDoc) {
            throw new Error("No organisation found for the given organisation id");
        }
        setOrganisations([organisationsDoc]);
    }

    async function initNonAdminProperties({
        role,
        id,
        organisationId,
    }: Pick<User, "id" | "organisationId" | "role">): Promise<void> {
        const propertiesRef = propertiesCollection(organisationId);
        const userPropertiesQuery =
            role === Role.PROPERTY_OWNER
                ? query(propertiesRef)
                : query(propertiesRef, where("relatedUsers", "array-contains", id));
        const { data, stop, pending, promise } = useFirestoreCollection<PropertyDoc[]>(
            createQuery(userPropertiesQuery),
        );

        const stopWatchPending = watch(
            pending,
            (newPending) => {
                setArePropertiesLoading(newPending);
            },
            { immediate: true },
        );

        const stopWatch = watch(
            () => data.value,
            (newProperties) => {
                setProperties(newProperties as unknown as PropertyDoc[]);
            },
            { deep: true },
        );

        addUnsub(() => {
            stopWatchPending();
            stopWatch();
            stop();
        });

        await promise.value;
        await nextTick();
    }

    return {
        properties,
        organisations,
        arePropertiesLoading,
        getOrganisationById,
        getPropertiesByOrganisationId,
        getOrganisationSettingsById,
        initUserOrganisation,
        initNonAdminProperties,
        getOrganisationNameById,
        getPropertyNameById,
        initAdminProperties,
        initOrganisations,
        cleanup,
    };
});
