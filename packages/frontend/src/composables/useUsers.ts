import { ref, watch } from "vue";
import { getDocs, query, where } from "firebase/firestore";
import { ADMIN, User } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { fetchUsersByRole, propertiesCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const isLoading = ref<boolean>(true);

    async function fetchRelatedProperties() {
        isLoading.value = true;
        try {
            const relatedPropertiesQuery = query(
                propertiesCollection(),
                where("relatedUsers", "array-contains", authStore.user?.id),
            );

            const snapshot = await getDocs(relatedPropertiesQuery);
            const propertyDocs = snapshot.docs.map((doc) => doc.data());
            return propertyDocs.flatMap((property) => property.relatedUsers);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUsers(): Promise<void> {
        isLoading.value = true;
        try {
            const relatedUserIds = await fetchRelatedProperties();
            if (authStore.user!.role === ADMIN || relatedUserIds.length) {
                users.value = (await fetchUsersByRole([...new Set(relatedUserIds)])).data;
            } else {
                users.value = [];
            }
        } finally {
            isLoading.value = false;
        }
    }

    watch(authStore.user!, fetchUsers, { immediate: true });

    return { users, fetchUsers, isLoading };
}
