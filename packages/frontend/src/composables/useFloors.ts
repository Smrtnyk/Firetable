import { showErrorMessage } from "src/helpers/ui-helpers";
import { onUnmounted, ref } from "vue";
import { floorsCollection } from "@firetable/backend";
import { FloorDoc, PropertyDoc } from "@firetable/types";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import { query, where, onSnapshot } from "firebase/firestore";

export type PropertyFloors = {
    propertyName: string;
    propertyId: string;
    organisationId: string;
    floors: FloorDoc[];
};

export type UsePropertyFloors = Record<string, PropertyFloors>;

export function useFloors() {
    const floors = ref<UsePropertyFloors>({});
    const isLoading = ref(true);
    const propertiesStore = usePropertiesStore();
    const unsubscribes: (() => void)[] = [];

    onUnmounted(() => {
        unsubscribes.forEach((unsubscribe) => unsubscribe());
    });

    async function fetchFloorsForProperty(property: PropertyDoc): Promise<void> {
        const floorQuery = query(
            floorsCollection(property.organisationId, property.id),
            where("propertyId", "==", property.id),
        );

        return new Promise<void>((resolve, reject) => {
            const unsubscribe = onSnapshot(
                floorQuery,
                (snapshot) => {
                    floors.value[property.id] = {
                        propertyId: property.id,
                        propertyName: property.name,
                        organisationId: property.organisationId,
                        floors: snapshot.docs.map(
                            (doc) =>
                                ({
                                    ...doc.data(),
                                    id: doc.id,
                                }) as FloorDoc,
                        ),
                    };
                    resolve();
                },
                (error) => {
                    console.error("Error fetching floors:", error);
                    reject(error);
                },
            );
            unsubscribes.push(unsubscribe);
        });
    }

    async function fetchAllFloors(): Promise<void> {
        try {
            const properties = await propertiesStore.getPropertiesOfCurrentUser();
            const fetchPromises = properties.map(fetchFloorsForProperty);

            await Promise.all(fetchPromises);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            isLoading.value = false;
        }
    }

    // Start fetching floors immediately
    const loadingPromise = fetchAllFloors();

    return { floors, isLoading, loadingPromise };
}
