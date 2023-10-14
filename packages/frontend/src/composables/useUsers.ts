import { ref, watch } from "vue";
import { documentId, getDocs, query, where } from "firebase/firestore";
import { User, UserPropertyMapDoc } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { userPropertyMapCollection, usersCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const propertiesIds = ref<string[]>([]);
    const userIdsToFetch = ref<string[]>([]);

    async function fetchUserPropertyMap() {
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
    }

    async function fetchUserIds(): Promise<string[]> {
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
    }

    async function fetchUsers(): Promise<void> {
        const usersQuery = query(
            usersCollection(),
            where(documentId(), "!=", authStore.user?.id),
            where(documentId(), "in", userIdsToFetch.value),
        );
        const usersSnapshot = await getDocs(usersQuery);
        users.value = usersSnapshot.docs.map((doc) => {
            const userData = doc.data() as User;
            return {
                ...userData,
                id: doc.id,
            };
        });
    }

    const fetchAndSetUsers = async () => {
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
    };

    watch(() => propertiesIds, fetchAndSetUsers, { immediate: true });

    return { users, fetchAndSetUsers, fetchUsers };
}
