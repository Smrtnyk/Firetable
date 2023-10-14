import { ref, onMounted } from "vue";
import { usePropertiesStore } from "stores/usePropertiesStore";
import { PropertyDoc } from "@firetable/types";

export function useProperties() {
    const propertiesStore = usePropertiesStore();
    const properties = ref<PropertyDoc[]>([]);
    const isLoading = ref(true);

    async function fetchProperties() {
        isLoading.value = true;
        properties.value = await propertiesStore.getPropertiesOfCurrentUser();
        isLoading.value = false;
    }

    onMounted(fetchProperties);

    return {
        fetchProperties,
        properties,
        isLoading,
    };
}
