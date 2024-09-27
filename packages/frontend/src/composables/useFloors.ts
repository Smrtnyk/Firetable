import type { FloorDoc, VoidFunction } from "@firetable/types";
import type { Ref } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { ref, onUnmounted } from "vue";
import { floorsCollection } from "@firetable/backend";
import { query, where, onSnapshot } from "firebase/firestore";
import { AppLogger } from "src/logger/FTLogger.js";

export function useFloors(
    propertyId: string,
    organisationId: string,
): {
    floors: Ref<FloorDoc[]>;
    isLoading: Ref<boolean>;
} {
    const floors = ref<FloorDoc[]>([]);
    const isLoading = ref(false);
    const unsubscribes: VoidFunction[] = [];

    onUnmounted(function () {
        unsubscribes.forEach(function (unsubscribe) {
            unsubscribe();
        });
    });

    async function fetchFloorsForProperty(): Promise<void> {
        const floorQuery = query(
            floorsCollection(organisationId, propertyId),
            where("propertyId", "==", propertyId),
        );

        floors.value = await new Promise<FloorDoc[]>(function (resolve, reject) {
            const unsubscribe = onSnapshot(
                floorQuery,
                function (snapshot) {
                    const res = snapshot.docs.map(function (doc) {
                        return {
                            ...doc.data(),
                            id: doc.id,
                        } as FloorDoc;
                    });
                    resolve(res);
                },
                function (error) {
                    AppLogger.error("Error fetching floors:", error);
                    reject(error);
                },
            );
            unsubscribes.push(unsubscribe);
        });
    }

    async function fetchFloors(): Promise<void> {
        try {
            isLoading.value = true;
            await fetchFloorsForProperty();
        } catch (error) {
            showErrorMessage(error);
        } finally {
            isLoading.value = false;
        }
    }

    fetchFloors();

    return { floors, isLoading };
}
