import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { EventDoc } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { reactive, ref } from "vue";
import { getEvents } from "@firetable/backend";

const EVENTS_PER_PAGE = 50;

/**
 * `useEvents` composable.
 *
 * This composable provides functionality to fetch and manage events from a backend service.
 *
 * @property eventsByProperty - A reactive object that holds events
 * grouped by their respective property IDs. Each property ID maps to a Set of EventDoc objects.
 *
 * @property lastFetchedDocForProperty - A reactive object that
 * tracks the last fetched document (event) for each property ID. This is used for pagination purposes,
 * ensuring that subsequent fetches start after this document.
 *
 * @property hasMoreEventsToFetch - A ref that indicates whether there are more events to
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
export function useEvents() {
    const eventsByProperty = reactive<Record<string, Set<EventDoc>>>({});
    const lastFetchedDocForProperty = reactive<Record<string, QueryDocumentSnapshot | null>>({});
    const hasMoreEventsToFetch = reactive<Record<string, boolean>>({});

    const isLoading = ref(false);

    async function fetchMoreEvents(
        eventOwner: EventOwner,
        lastDoc: QueryDocumentSnapshot | null,
    ): Promise<EventDoc[]> {
        isLoading.value = true;
        const { propertyId } = eventOwner;

        try {
            const eventsDocs = await getEvents(lastDoc, EVENTS_PER_PAGE, eventOwner);
            lastFetchedDocForProperty[propertyId] =
                eventsDocs.length > 0 ? eventsDocs[eventsDocs.length - 1]._doc : null;

            eventsByProperty[propertyId] = new Set([
                ...(eventsByProperty[propertyId] || []),
                ...eventsDocs,
            ]);

            if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
                hasMoreEventsToFetch[propertyId] = false;
            }

            return eventsDocs;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        EVENTS_PER_PAGE,
        eventsByProperty,
        lastFetchedDocForProperty,
        hasMoreEventsToFetch,
        fetchMoreEvents,
        isLoading,
    };
}
