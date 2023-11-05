import { defineStore } from "pinia";
import { useAuthStore } from "src/stores/auth-store";
import { fetchPropertiesForUser } from "@firetable/backend";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { PropertyDoc, User } from "@firetable/types";

export const usePropertiesStore = defineStore("properties", {
    state: () => ({
        properties: [],
    }),
    actions: {
        async getPropertiesOfUser(user: User) {
            try {
                return await fetchPropertiesForUser(user);
            } catch (e) {
                showErrorMessage(e);
            }
        },
        async getPropertiesOfCurrentUser(): Promise<PropertyDoc[]> {
            try {
                const authStore = useAuthStore();
                return await fetchPropertiesForUser(authStore.user!, authStore.user!.role);
            } catch (e) {
                showErrorMessage(e);
            }
            return [];
        },
    },
});
