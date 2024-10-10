import type { User } from "@firetable/types";
import { ref, watch } from "vue";
import { fetchUsersByRole } from "@firetable/backend";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";
import { showErrorMessage } from "src/helpers/ui-helpers";

export function useUsers(organisationId: string) {
    const { properties } = storeToRefs(usePropertiesStore());
    const users = ref<User[]>([]);
    const isLoading = ref<boolean>(true);

    async function fetchUsers(): Promise<void> {
        try {
            isLoading.value = true;
            users.value = (await fetchUsersByRole(organisationId)).data;
        } catch (error) {
            showErrorMessage(error);
        } finally {
            isLoading.value = false;
        }
    }

    watch(
        function () {
            return properties.value.length;
        },
        async function (length) {
            if (length === 0) {
                return;
            }
            await fetchUsers();
        },
        { immediate: true },
    );

    return { users, fetchUsers, isLoading };
}
