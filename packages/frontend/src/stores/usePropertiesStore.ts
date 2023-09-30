import { defineStore } from "pinia";
import { useAuthStore } from "stores/auth-store";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
} from "src/composables/useFirestore";
import { Collection, PropertyDoc } from "@firetable/types";
import { documentId, where } from "firebase/firestore";
import { computed } from "vue";
import { takeProp } from "@firetable/utils";
import { fetchPropertiesForUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";

export const usePropertiesStore = defineStore("properties", {
    state: () => ({
        properties: [],
    }),
    actions: {
        async getPropertiesOnce() {
            const authStore = useAuthStore();
            const propertiesIds = computed(() => {
                return authStore.userPropertyMap.map(takeProp("propertyId"));
            });
            if (propertiesIds.value.length) {
                const res = useFirestoreCollection<PropertyDoc[]>(
                    createQuery(
                        getFirestoreCollection(Collection.PROPERTIES),
                        where(documentId(), "in", propertiesIds.value),
                    ),
                );
                await res.promise.value;
                return res.data.value;
            }
            return [];
        },
        async getPropertiesOfUser(userId: string) {
            try {
                return await fetchPropertiesForUser(userId);
            } catch (e) {
                showErrorMessage(e);
            }
        },
    },
});
