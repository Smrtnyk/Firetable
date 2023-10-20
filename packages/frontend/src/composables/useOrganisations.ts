import { onMounted, ref } from "vue";
import { ADMIN, OrganisationDoc } from "@firetable/types";
import { useAuthStore } from "stores/auth-store";
import { fetchOrganisationById, fetchOrganisationsForAdmin } from "@firetable/backend";

export function useOrganisations() {
    const auth = useAuthStore();
    const organisations = ref<OrganisationDoc[]>([]);
    const error = ref<null | Error>(null);
    const isLoading = ref(true);

    async function fetchOrganisations() {
        isLoading.value = true;
        try {
            if (auth.user?.role === ADMIN) {
                organisations.value = await fetchOrganisationsForAdmin();
            } else {
                const organisationsDoc = await fetchOrganisationById(auth.user!.organisationId);
                if (organisationsDoc) {
                    organisations.value.push(organisationsDoc);
                }
            }
        } catch (e: any) {
            error.value = e;
        } finally {
            isLoading.value = false;
        }
    }

    onMounted(fetchOrganisations);

    return {
        fetchOrganisations,
        organisations,
        isLoading,
        error,
    };
}
