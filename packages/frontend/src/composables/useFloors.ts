import type { FloorDoc } from "@firetable/types";
import type { Ref } from "vue";
import { floorsCollection } from "@firetable/backend";
import { where } from "firebase/firestore";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";

export function useFloors(
    propertyId: string,
    organisationId: string,
): {
    floors: Ref<FloorDoc[]>;
    isLoading: Ref<boolean>;
} {
    const { data: floors, pending: isLoading } = useFirestoreCollection<FloorDoc[]>(
        createQuery(
            floorsCollection(organisationId, propertyId),
            where("propertyId", "==", propertyId),
        ),
        {
            wait: true,
        },
    );

    return {
        floors: floors as unknown as Ref<FloorDoc[]>,
        isLoading,
    };
}
