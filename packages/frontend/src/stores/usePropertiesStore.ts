import { defineStore } from "pinia";
import { useAuthStore } from "stores/auth-store";
import { fetchPropertiesForUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyDoc } from "@firetable/types";

export const usePropertiesStore = defineStore("properties", {
    state: () => ({
        properties: [],
    }),
    actions: {
        async getPropertiesOfUser(userId: string) {
            try {
                return await fetchPropertiesForUser(userId);
            } catch (e) {
                showErrorMessage(e);
            }
        },
        async getPropertiesOfCurrentUser(): Promise<PropertyDoc[]> {
            try {
                const authStore = useAuthStore();
                return await fetchPropertiesForUser(authStore.user!.id, authStore.user!.role);
            } catch (e) {
                showErrorMessage(e);
            }
            return [];
        },
    },
});
