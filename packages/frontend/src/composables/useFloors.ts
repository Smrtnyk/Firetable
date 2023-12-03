import { showErrorMessage } from "src/helpers/ui-helpers";
import type { Ref } from "vue";
import { onUnmounted, ref, watch } from "vue";
import { floorsCollection } from "@firetable/backend";
import type { FloorDoc, PropertyDoc } from "@firetable/types";
import { query, where, onSnapshot } from "firebase/firestore";

export type PropertyFloors = {
    propertyName: string;
    propertyId: string;
    organisationId: string;
    floors: FloorDoc[];
};

export type UsePropertyFloors = Record<string, PropertyFloors>;

export function useFloors(properties: Ref<PropertyDoc[]>) {
    const floors = ref<UsePropertyFloors>({});
    const isLoading = ref(false);
    const unsubscribes: (() => void)[] = [];

    const watcher = watch(
        properties,
        async (newProperties) => {
            if (newProperties.length > 0) {
                await fetchAllFloors();
            }
        },
        { immediate: true, deep: true },
    );

    unsubscribes.push(watcher);

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
            isLoading.value = true;
            const fetchPromises = properties.value.map(fetchFloorsForProperty);
            await Promise.all(fetchPromises);
        } catch (error) {
            showErrorMessage(error);
        } finally {
            isLoading.value = false;
        }
    }

    return { floors, isLoading };
}
