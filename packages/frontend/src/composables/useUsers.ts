import { ref, watch } from "vue";
import { getDocs, query, where } from "firebase/firestore";
import { ADMIN, User } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { fetchUsersByRole, propertiesCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const isLoading = ref<boolean>(true);

    async function fetchRelatedProperties(): Promise<string[]> {
        const relatedPropertiesQuery = query(
            propertiesCollection(authStore.user!.organisationId),
            where("relatedUsers", "array-contains", authStore.user?.id),
        );

        const snapshot = await getDocs(relatedPropertiesQuery);
        const propertyDocs = snapshot.docs.map((doc) => doc.data());
        return propertyDocs.flatMap((property) => property.relatedUsers);
    }

    async function fetchUsers(): Promise<void> {
        isLoading.value = true;
        try {
            if (authStore.user?.role === ADMIN) {
                users.value = (await fetchUsersByRole([], "")).data;
            } else {
                const relatedUserIds = await fetchRelatedProperties();
                if (relatedUserIds.length) {
                    users.value = (
                        await fetchUsersByRole(
                            [...new Set(relatedUserIds)],
                            authStore.user!.organisationId,
                        )
                    ).data;
                } else {
                    users.value = [];
                }
            }
        } finally {
            isLoading.value = false;
        }
    }

    watch(authStore.user!, fetchUsers, { immediate: true });

    return { users, fetchUsers, isLoading };
}
