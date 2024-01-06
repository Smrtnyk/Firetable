import type { OrganisationDoc, PropertyDoc, User } from "@firetable/types";
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

    async function initNonAdminProperties({
        role,
        id,
        organisationId,
    }: Pick<User, "id" | "organisationId" | "role">): Promise<void> {
        // Initialize organisation for user first
        const organisationsDoc = await fetchOrganisationById(organisationId);
        if (!organisationsDoc) {
            throw new Error("No organisation found for the given organisation id");
        }
        setOrganisations([organisationsDoc]);
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
        initNonAdminProperties,
        getOrganisationNameById,
        getPropertyNameById,
        setProperties,
        setOrganisations,
        cleanup,
    };
});

export async function initOrganisations(): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const organisations = await fetchOrganisationsForAdmin();
    propertiesStore.setOrganisations(organisations);
}

export async function initAdminProperties(): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const allProperties = await fetchPropertiesForAdmin(propertiesStore.organisations);
    propertiesStore.setProperties(allProperties);
}
