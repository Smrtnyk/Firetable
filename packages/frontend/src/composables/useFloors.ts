import type { Ref } from "vue";
import type { FloorDoc, PropertyDoc } from "@firetable/types";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { onUnmounted, ref, watch } from "vue";
import { floorsCollection } from "@firetable/backend";
import { query, where, onSnapshot } from "firebase/firestore";
import { AppLogger } from "src/logger/FTLogger.js";

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
        async function (newProperties) {
            if (newProperties.length > 0) {
                await fetchAllFloors();
            }
        },
        { immediate: true, deep: true },
    );

    unsubscribes.push(watcher);

    onUnmounted(function () {
        unsubscribes.forEach(function (unsubscribe) {
            unsubscribe();
        });
    });

    async function fetchFloorsForProperty(property: PropertyDoc): Promise<void> {
        const floorQuery = query(
            floorsCollection(property.organisationId, property.id),
            where("propertyId", "==", property.id),
        );

        return new Promise<void>(function (resolve, reject) {
            const unsubscribe = onSnapshot(
                floorQuery,
                function (snapshot) {
                    floors.value[property.id] = {
                        propertyId: property.id,
                        propertyName: property.name,
                        organisationId: property.organisationId,
                        floors: snapshot.docs.map(function (doc) {
                            return {
                                ...doc.data(),
                                id: doc.id,
                            } as FloorDoc;
                        }),
                    };
                    resolve();
                },
                function (error) {
                    AppLogger.error("Error fetching floors:", error);
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
