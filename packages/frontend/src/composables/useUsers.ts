import { ref, watchEffect, computed } from "vue";
import { query, where, getDocs, documentId } from "firebase/firestore";
import { User, UserPropertyMapDoc } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { userPropertyMapCollection, usersCollection } from "@firetable/backend";

async function fetchUserIds(propertiesIds: string[]): Promise<string[]> {
    const userPropertyMapQuery = query(
        userPropertyMapCollection(),
        where("propertyId", "in", propertiesIds),
    );
    const userPropertyMapSnapshot = await getDocs(userPropertyMapQuery);
    const allUsersIdsDocs = userPropertyMapSnapshot.docs.map(
        (doc) => doc.data() as UserPropertyMapDoc,
    );
    return allUsersIdsDocs.map((map) => map.userId);
}

async function fetchUsers(userIdsToFetch: string[], excludeId?: string): Promise<User[]> {
    const baseQuery = excludeId ? [where(documentId(), "!=", excludeId)] : [];
    const usersQuery = query(
        usersCollection(),
        ...baseQuery,
        where(documentId(), "in", userIdsToFetch),
    );
    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.docs.map((doc) => doc.data() as User);
}

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const propertiesIds = computed(() => {
        return authStore.userPropertyMap.map((map) => map.propertyId) || [];
    });

    watchEffect(async () => {
        if (propertiesIds.value.length > 0) {
            const userIdsToFetch = await fetchUserIds(propertiesIds.value);
            if (userIdsToFetch.length > 0) {
                users.value = await fetchUsers(userIdsToFetch, authStore.user?.id);
            } else {
                users.value = [];
            }
        } else {
            users.value = [];
        }
    });

    return { users, fetchUserIds, fetchUsers };
}
