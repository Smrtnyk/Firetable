import { reactive, ref } from "vue";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { EventDoc } from "@firetable/types";
import { getEvents } from "@firetable/backend";

const EVENTS_PER_PAGE = 10;

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
    const hasMoreEventsToFetch = ref(true);
    const isLoading = ref(true); // Initialize isLoading to true
    const hasInitialFetchCompleted = ref(false); // A ref to keep track of whether the initial fetch has completed

    async function fetchMoreEvents(propertyId: string, lastDoc: QueryDocumentSnapshot | null) {
        // Check if you're trying to fetch with the same lastDoc
        if (lastFetchedDocForProperty[propertyId] === lastDoc) {
            console.warn("Trying to fetch with same lastDoc for property:", propertyId);
            return [];
        }

        const eventsDocs = await getEvents(lastDoc, EVENTS_PER_PAGE, propertyId);
        lastFetchedDocForProperty[propertyId] = eventsDocs.length
            ? eventsDocs[eventsDocs.length - 1]._doc
            : null;

        eventsByProperty[propertyId] = new Set([
            ...(eventsByProperty[propertyId] || []),
            ...eventsDocs,
        ]);

        if (!eventsDocs || eventsDocs.length < EVENTS_PER_PAGE) {
            hasMoreEventsToFetch.value = false;
        }

        // If this is the initial fetch, set isLoading to false and mark the initial fetch as completed
        if (!hasInitialFetchCompleted.value) {
            isLoading.value = false;
            hasInitialFetchCompleted.value = true;
        }

        return eventsDocs;
    }

    return {
        eventsByProperty,
        lastFetchedDocForProperty,
        hasMoreEventsToFetch,
        fetchMoreEvents,
        isLoading,
    };
}
