import { defineStore } from "pinia";
import {
    fetchOrganisationById,
    fetchOrganisationsForAdmin,
    fetchPropertiesForAdmin,
    propertiesCollection,
} from "@firetable/backend";
import { ADMIN, OrganisationDoc, PropertyDoc, User } from "@firetable/types";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { query, where } from "firebase/firestore";
import { watch } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import { NOOP } from "@firetable/utils";

interface State {
    properties: PropertyDoc[];
    organisations: OrganisationDoc[];
    unsubPropertiesWatch: typeof NOOP;
}

export const usePropertiesStore = defineStore("properties", {
    state: () =>
        ({
            properties: [],
            organisations: [],
            unsubPropertiesWatch: NOOP,
        }) as State,
    actions: {
        cleanup() {
            this.unsubPropertiesWatch();
            this.properties = [];
        },

        getPropertiesOfCurrentUser(): PropertyDoc[] {
            return this.properties;
        },

        async getOrganisations() {
            if (this.organisations.length) {
                return this.organisations;
            }

            const auth = useAuthStore();
            if (auth.user?.role === ADMIN) {
                this.organisations = await fetchOrganisationsForAdmin();
            } else {
                const organisationsDoc = await fetchOrganisationById(auth.user!.organisationId);
                if (organisationsDoc) {
                    this.organisations.push(organisationsDoc);
                }
            }

            return this.organisations;
        },

        setProperties(properties: PropertyDoc[]) {
            this.properties = properties;
        },
    },
});

export async function initAdminProperties(): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const allProperties = await fetchPropertiesForAdmin();
    propertiesStore.setProperties(allProperties);
}

export async function initNonAdminProperties({
    id,
    organisationId,
}: Pick<User, "id" | "organisationId">): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const propertiesRef = propertiesCollection(organisationId);
    const userPropertiesQuery = query(propertiesRef, where("relatedUsers", "array-contains", id));
    const { data, stop } = useFirestoreCollection<PropertyDoc[]>(createQuery(userPropertiesQuery));

    const stopWatch = watch(
        () => data.value,
        (newProperties) => {
            propertiesStore.setProperties(newProperties as unknown as PropertyDoc[]);
        },
        { deep: true },
    );

    propertiesStore.unsubPropertiesWatch = () => {
        stopWatch();
        stop();
    };
}
