import { ref, watchEffect, computed } from "vue";
import { query, where, getDocs, documentId } from "firebase/firestore";
import { User, UserPropertyMapDoc } from "@firetable/types";
import { useAuthStore } from "src/stores/auth-store";
import { userPropertyMapCollection, usersCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const propertiesIds = computed(() => {
        return authStore.userPropertyMap.map((map) => map.propertyId) || [];
    });

    watchEffect(async () => {
        if (propertiesIds.value.length > 0) {
            const userPropertyMapQuery = query(
                userPropertyMapCollection(),
                where("propertyId", "in", propertiesIds.value),
            );
            const userPropertyMapSnapshot = await getDocs(userPropertyMapQuery);
            const allUsersIds = userPropertyMapSnapshot.docs.map(
                (doc) => doc.data() as UserPropertyMapDoc,
            );
            const userIdsToFetch = allUsersIds.map((map) => map.userId);

            const usersQuery = query(
                usersCollection(),
                where(documentId(), "!=", authStore.user?.id),
                where(documentId(), "in", userIdsToFetch),
            );
            const usersSnapshot = await getDocs(usersQuery);
            users.value = usersSnapshot.docs.map((doc) => doc.data() as User);
        } else {
            users.value = [];
        }
    });

    return { users };
}
