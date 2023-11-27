import { defineStore } from "pinia";
import {
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    fetchPropertiesForAdmin,
    propertiesCollection,
} from "@firetable/backend";
import { OrganisationDoc, PropertyDoc, User } from "@firetable/types";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { query, where } from "firebase/firestore";
import { nextTick, ref, watch } from "vue";
import { NOOP } from "@firetable/utils";

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

    function addUnsub(unsub: typeof NOOP): void {
        unsubs.value.push(unsub);
    }

    async function getOrganisations(organisationId: string): Promise<OrganisationDoc[]> {
        if (organisations.value.length > 0) {
            return organisations.value;
        }

        const organisationsDoc = await fetchOrganisationById(organisationId);
        if (organisationsDoc) {
            organisations.value = [organisationsDoc];
        }

        return organisations.value;
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

    return {
        properties,
        organisations,
        arePropertiesLoading,
        setArePropertiesLoading,
        setProperties,
        setOrganisations,
        getOrganisations,
        cleanup,
        addUnsub,
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

export async function initNonAdminProperties({
    id,
    organisationId,
}: Pick<User, "id" | "organisationId">): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const propertiesRef = propertiesCollection(organisationId);
    const userPropertiesQuery = query(propertiesRef, where("relatedUsers", "array-contains", id));
    const { data, stop, pending, promise } = useFirestoreCollection<PropertyDoc[]>(
        createQuery(userPropertiesQuery),
    );

    const stopWatchPending = watch(
        pending,
        (newPending) => {
            propertiesStore.setArePropertiesLoading(newPending);
        },
        { immediate: true },
    );

    const stopWatch = watch(
        () => data.value,
        (newProperties) => {
            propertiesStore.setProperties(newProperties as unknown as PropertyDoc[]);
        },
        { deep: true },
    );

    propertiesStore.addUnsub(() => {
        stopWatchPending();
        stopWatch();
        stop();
    });

    await promise.value;
    await nextTick();
}
