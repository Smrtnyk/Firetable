import type { GuestDoc } from "@firetable/types";
import type { _RefFirestore, VueFirestoreQueryData } from "vuefire";
import { defineStore } from "pinia";
import { getGuestsPath } from "@firetable/backend";
import { useFirestoreCollection } from "src/composables/useFirestore";

export const useGuestsStore = defineStore("guests", function () {
    const refsMap = new Map<string, _RefFirestore<VueFirestoreQueryData<GuestDoc>>>();

    function getGuests(organisationId: string): _RefFirestore<VueFirestoreQueryData<GuestDoc>> {
        if (!refsMap.get(organisationId)) {
            refsMap.set(
                organisationId,
                useFirestoreCollection<GuestDoc>(getGuestsPath(organisationId), {
                    wait: true,
                }),
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just set it
        return refsMap.get(organisationId)!;
    }

    return {
        getGuests,
    };
});
