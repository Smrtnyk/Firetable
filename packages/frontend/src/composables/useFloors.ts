import { showErrorMessage } from "src/helpers/ui-helpers";
import { onUnmounted, ref } from "vue";
import { floorsCollection } from "@firetable/backend";
import { FloorDoc } from "@firetable/types";
import { usePropertiesStore } from "stores/usePropertiesStore";
import { query, where, onSnapshot } from "firebase/firestore";

export type PropertyFloors = {
    propertyName: string;
    propertyId: string;
    floors: FloorDoc[];
};
export type UsePropertyFloors = Record<string, PropertyFloors>;

export function useFloors() {
    const floors = ref<Record<string, PropertyFloors>>({});
    const isLoading = ref(true);
    const propertiesStore = usePropertiesStore();

    const loadingPromise = propertiesStore
        .getPropertiesOfCurrentUser()
        .then((properties) => {
            console.log("got properties", properties);
            const unsubscribes: (() => void)[] = [];
            const fetchPromises: Promise<void>[] = [];

            properties.forEach((property) => {
                const floorQuery = query(
                    floorsCollection(),
                    where("propertyId", "==", property.id),
                );

                const fetchPromise = new Promise<void>((resolve) => {
                    const unsubscribe = onSnapshot(
                        floorQuery,
                        (snapshot) => {
                            floors.value[property.id] = {
                                propertyId: property.id,
                                propertyName: property.name,
                                floors: snapshot.docs.map(function (doc) {
                                    console.log("got floor doc ", doc.data());
                                    return {
                                        ...doc.data(),
                                        id: doc.id,
                                    } as FloorDoc;
                                }),
                            };
                            resolve();
                        },
                        (error) => {
                            console.error("Error fetching floors:", error);
                        },
                    );
                    unsubscribes.push(unsubscribe);
                });

                fetchPromises.push(fetchPromise);
            });

            return Promise.all(fetchPromises)
                .then(() => (isLoading.value = false))
                .catch(showErrorMessage)
                .finally(() => {
                    onUnmounted(() => {
                        for (const unsubscribe of unsubscribes) {
                            unsubscribe();
                        }
                    });
                });
        })
        .catch((err) => {
            showErrorMessage(err);
            isLoading.value = false;
        });

    return { floors, isLoading, loadingPromise };
}
