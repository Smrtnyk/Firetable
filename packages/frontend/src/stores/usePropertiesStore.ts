import { defineStore } from "pinia";
import { useAuthStore } from "src/stores/auth-store";
import { fetchPropertiesForUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyDoc } from "@firetable/types";

export const usePropertiesStore = defineStore("properties", {
    state: () => ({
        properties: [],
    }),
    actions: {
        async getPropertiesOfCurrentUser(): Promise<PropertyDoc[]> {
            try {
                const authStore = useAuthStore();
                return await fetchPropertiesForUser(authStore.user!);
            } catch (e) {
                showErrorMessage(e);
            }
            return [];
        },
    },
});
