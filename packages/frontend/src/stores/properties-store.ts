import type {
    DeepRequired,
    OrganisationDoc,
    OrganisationSettings,
    PropertyDoc,
    PropertySettings,
    User,
} from "@firetable/types";
import type { noop } from "es-toolkit";
import { Role } from "@firetable/types";
import { merge } from "es-toolkit";
import { defineStore } from "pinia";
import {
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    fetchPropertiesForAdmin,
    propertiesCollection,
} from "@firetable/backend";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { documentId, query, where } from "firebase/firestore";
import { nextTick, ref, watch } from "vue";
import { matchesProperty } from "es-toolkit/compat";
import { getDefaultTimezone } from "src/helpers/date-utils";

const DEFAULT_PROPERTY_SETTINGS = {
    timezone: getDefaultTimezone(),
};

export const DEFAULT_ORGANISATION_SETTINGS: DeepRequired<OrganisationSettings> = {
    event: {
        eventStartTime24HFormat: "22:00",
        eventDurationInHours: 10,
        eventCardAspectRatio: "16:9",
        reservationArrivedColor: "#1a7722",
        reservationConfirmedColor: "#6247aa",
        reservationCancelledColor: "#ff9f43",
        reservationPendingColor: "#2ab7ca",
        reservationWaitingForResponseColor: "#b5a22c",
    },
    property: {
        propertyCardAspectRatio: "1",
    },
    guest: {
        collectGuestData: false,
    },
};

export const usePropertiesStore = defineStore("properties", function () {
    const properties = ref<PropertyDoc[]>([]);
    const arePropertiesLoading = ref(false);
    const organisations = ref<OrganisationDoc[]>([]);
    const unsubs = ref<(typeof noop)[]>([]);

    function cleanup(): void {
        for (const unsub of unsubs.value) {
            unsub();
        }
        properties.value = [];
        organisations.value = [];
        arePropertiesLoading.value = false;
    }

    function getOrganisationById(organisationId: string): OrganisationDoc {
        const organisation = organisations.value.find(matchesProperty("id", organisationId));
        if (!organisation) {
            throw new Error("No organisation found for the given organisation id");
        }
        return organisation;
    }

    function getOrganisationNameById(organisationId: string): string {
        return getOrganisationById(organisationId)?.name ?? "";
    }

    function getPropertyNameById(propertyId: string): string {
        return properties.value.find(matchesProperty("id", propertyId))?.name ?? "";
    }

    function getOrganisationSettingsById(organisationId: string): OrganisationSettings {
        const settings = getOrganisationById(organisationId)?.settings ?? {};
        return merge(DEFAULT_ORGANISATION_SETTINGS, settings);
    }

    function getPropertySettingsById(propertyId: string): PropertySettings {
        const property = properties.value.find(matchesProperty("id", propertyId));
        if (!property) {
            throw new Error("No property found for the given property id");
        }
        return merge(DEFAULT_PROPERTY_SETTINGS, property.settings ?? {});
    }

    function getPropertiesByOrganisationId(organisationId: string): PropertyDoc[] {
        return properties.value.filter(matchesProperty("organisationId", organisationId));
    }

    async function initOrganisations(): Promise<void> {
        const organisationsData = await fetchOrganisationsForAdmin();
        setOrganisations(organisationsData);
    }

    async function initAdminProperties(): Promise<void> {
        const allProperties = await fetchPropertiesForAdmin(organisations.value);
        setProperties(allProperties);
    }

    function addUnsub(unsub: typeof noop): void {
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
        organisationId,
        relatedProperties,
    }: Pick<User, "organisationId" | "relatedProperties" | "role">): Promise<void> {
        if (role !== Role.PROPERTY_OWNER && relatedProperties.length === 0) {
            setProperties([]);
            return;
        }

        const propertiesRef = propertiesCollection(organisationId);
        const userPropertiesQuery =
            role === Role.PROPERTY_OWNER
                ? query(propertiesRef)
                : query(propertiesRef, where(documentId(), "in", relatedProperties));

        const { data, stop, pending, promise } = useFirestoreCollection<PropertyDoc[]>(
            createQuery(userPropertiesQuery),
        );

        const stopWatchPending = watch(
            pending,
            function (newPending) {
                setArePropertiesLoading(newPending);
            },
            { immediate: true },
        );

        const stopWatch = watch(
            () => data.value,
            function (newProperties) {
                setProperties(newProperties as unknown as PropertyDoc[]);
            },
            { deep: true },
        );

        addUnsub(function () {
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
        getPropertySettingsById,
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
