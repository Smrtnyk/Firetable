import { reactive, ref } from "vue";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { EventDoc } from "@firetable/types";
import { getEvents } from "@firetable/backend";

const EVENTS_PER_PAGE = 10;

export function useEvents() {
    const eventsByProperty = reactive<Record<string, Set<EventDoc>>>({});
    const lastFetchedDocForProperty = reactive<Record<string, QueryDocumentSnapshot | null>>({});
    const hasMoreEventsToFetch = ref(true);

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

        return eventsDocs;
    }

    function getEventsForProperty(propertyId: string): Set<EventDoc> | undefined {
        return eventsByProperty[propertyId];
    }

    function getLastDocForProperty(propertyId: string): QueryDocumentSnapshot | null | undefined {
        return lastFetchedDocForProperty[propertyId];
    }

    return {
        eventsByProperty,
        lastFetchedDocForProperty,
        hasMoreEventsToFetch,
        fetchMoreEvents,
        getEventsForProperty,
        getLastDocForProperty,
    };
}
