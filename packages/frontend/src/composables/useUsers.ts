import { ref, watchEffect, computed } from "vue";
import { documentId, where } from "firebase/firestore";
import { User, UserPropertyMapDoc } from "@firetable/types";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import { userPropertyMapCollection, usersCollection } from "@firetable/backend";

export function useUsers() {
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const propertiesIds = computed(() => {
        return (
            authStore.userPropertyMap.map((map) => {
                return map.propertyId;
            }) || []
        );
    });

    watchEffect(async () => {
        if (propertiesIds.value.length > 0) {
            const { data: allUsersIds, promise: userIdsPromise } =
                useFirestoreCollection<UserPropertyMapDoc>(
                    createQuery(
                        userPropertyMapCollection(),
                        where("propertyId", "in", propertiesIds.value),
                    ),
                    { once: true },
                );
            await userIdsPromise.value;
            const userIdsToFetch = allUsersIds.value.map((map) => {
                return map.userId;
            });
            const res = useFirestoreCollection<User>(
                createQuery(
                    usersCollection(),
                    where(documentId(), "!=", authStore.user?.id),
                    where(documentId(), "in", userIdsToFetch),
                ),
                { once: true },
            );
            await res.promise.value;
            users.value = res.data.value;
        } else {
            users.value = [];
        }
    });

    return { users };
}
