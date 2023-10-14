import { ref, watch } from "vue";
import { getDocs, query, where } from "firebase/firestore";
import { User, UserPropertyMapDoc } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { fetchUsersByRole, userPropertyMapCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const propertiesIds = ref<string[]>([]);
    const userIdsToFetch = ref<string[]>([]);
    const isLoading = ref<boolean>(false); // New isLoading ref

    async function fetchUserPropertyMap() {
        isLoading.value = true;
        try {
            const userPropertyMapQuery = query(
                userPropertyMapCollection(),
                where("userId", "==", authStore.user?.id),
            );

            const snapshot = await getDocs(userPropertyMapQuery);
            const properties: UserPropertyMapDoc[] = snapshot.docs.map(
                (doc) => doc.data() as UserPropertyMapDoc,
            );
            propertiesIds.value = properties.map((map) => {
                return map.propertyId;
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUserIds(): Promise<string[]> {
        isLoading.value = true;
        try {
            const userPropertyMapQuery = query(
                userPropertyMapCollection(),
                where("propertyId", "in", propertiesIds.value),
            );
            const userPropertyMapSnapshot = await getDocs(userPropertyMapQuery);
            const allUsersIdsDocs = userPropertyMapSnapshot.docs.map(
                (doc) => doc.data() as UserPropertyMapDoc,
            );
            userIdsToFetch.value = allUsersIdsDocs.map((map) => map.userId);
            return userIdsToFetch.value;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchUsers(): Promise<void> {
        isLoading.value = true;
        try {
            users.value = (await fetchUsersByRole([...new Set(userIdsToFetch.value)])).data;
        } finally {
            isLoading.value = false;
        }
    }

    const fetchAndSetUsers = async () => {
        isLoading.value = true;
        try {
            await fetchUserPropertyMap();
            if (propertiesIds.value.length > 0) {
                const userIdsToFetch = await fetchUserIds();
                if (userIdsToFetch.length > 0) {
                    await fetchUsers();
                } else {
                    users.value = [];
                }
            } else {
                users.value = [];
            }
        } finally {
            isLoading.value = false;
        }
    };

    watch(() => propertiesIds, fetchAndSetUsers, { immediate: true });

    return { users, fetchAndSetUsers, fetchUsers, isLoading };
}
