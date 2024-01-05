import type { User } from "@firetable/types";
import { ref, watch } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import { fetchUsersByRole } from "@firetable/backend";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { showErrorMessage } from "src/helpers/ui-helpers";

export function useUsers(organisationId: string) {
    const { properties } = storeToRefs(usePropertiesStore());
    const authStore = useAuthStore();
    const users = ref<User[]>([]);
    const isLoading = ref<boolean>(true);

    async function fetchUsers(): Promise<void> {
        try {
            if (authStore.isAdmin) {
                isLoading.value = true;
                users.value = (await fetchUsersByRole([], organisationId)).data;
            } else {
                const relatedIds = properties.value.flatMap((property) => property.relatedUsers);
                if (relatedIds.length === 0) {
                    users.value = [];
                    return;
                }

                isLoading.value = true;
                users.value = (
                    await fetchUsersByRole([...new Set(relatedIds)], authStore.user!.organisationId)
                ).data;
            }
        } catch (error) {
            showErrorMessage(error);
        } finally {
            isLoading.value = false;
        }
    }

    watch(
        () => properties.value.length,
        async (length) => {
            if (length === 0) {
                return;
            }
            await fetchUsers();
        },
        { immediate: true },
    );

    return { users, fetchUsers, isLoading };
}
