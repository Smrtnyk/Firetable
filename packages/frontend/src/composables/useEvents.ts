import type { EventOwner } from "@firetable/backend";
import type { EventDoc } from "@firetable/types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

import { getEvents } from "@firetable/backend";
import { last } from "es-toolkit";
import { ref } from "vue";

const EVENTS_PER_PAGE = 50;

/**
 * `useEvents` composable.
 *
 * This composable provides functionality to fetch and manage events from a backend service.
 *
 * @property events - A reactive array that holds events
 *
 * @property done - A ref that indicates whether there are more events to
 * fetch. It's set to `false` when the fetched events are less than the expected EVENTS_PER_PAGE, signaling
 * that there might be no more events to fetch.
 *
 * @property fetchMoreEvents - An async function that fetches more events for a given property ID.
 * Takes in the property ID and the last fetched document as parameters. If trying to fetch with the same
 * last document, it warns and exits. After fetching, it updates the eventsByProperty and
 * lastFetchedDocForProperty. If this is the initial fetch, it also updates the isLoading ref.
 *
 * @property isLoading - A ref that indicates the loading state. It's initially set to `true`
 * and becomes `false` after the first fetch completes. It remains unchanged for subsequent fetches.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useEvents(eventOwner: EventOwner) {
    const events = ref<EventDoc[]>([]);
    const lastFetchedDoc = ref<QueryDocumentSnapshot | undefined>();
    const done = ref(false);

    const isLoading = ref(false);

    async function fetchMoreEvents(): Promise<void> {
        if (done.value) {
            return;
        }

        isLoading.value = true;

        try {
            const eventsDocs = await getEvents(lastFetchedDoc.value, EVENTS_PER_PAGE, eventOwner);
            lastFetchedDoc.value = last(eventsDocs)?._doc;

            events.value.push(...eventsDocs);

            if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
                done.value = true;
            }
        } finally {
            isLoading.value = false;
        }
    }

    return {
        done,
        events,
        fetchMoreEvents,
        isLoading,
    };
}
