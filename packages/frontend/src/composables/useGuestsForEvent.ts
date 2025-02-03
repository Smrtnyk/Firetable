import type { EventOwner } from "@firetable/backend";
import type { GuestDoc, ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";

import { uniq } from "es-toolkit";
import { matchesProperty, property } from "es-toolkit/compat";
import { hashString } from "src/helpers/hash-string";
import { useGuestsStore } from "src/stores/guests-store";
import { computed, ref, watch } from "vue";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useGuestsForEvent(eventOwner: EventOwner, reservations: Ref<ReservationDoc[]>) {
    const guestsStore = useGuestsStore();

    const guestContacts = computed<string[]>(() => {
        const values = reservations.value.map(property("guestContact")).filter(Boolean);
        return uniq(values);
    });

    const guests = ref<GuestDoc[]>([]);

    watch(
        guestContacts,
        async function (contacts) {
            const hashedContacts = await Promise.all(contacts.map(hashString));

            const guestsFromStore = await guestsStore.getGuestsByHashedContacts(
                eventOwner.organisationId,
                hashedContacts,
            );

            guests.value = guestsFromStore.filter(Boolean) as GuestDoc[];
        },
        { immediate: true },
    );

    const returningGuests = computed(() => {
        return guests.value
            .map(function (guest) {
                const currentPropertyVisits = guest.visitedProperties[eventOwner.propertyId] ?? {};
                const visitsWithoutCurrentEvent = Object.entries(currentPropertyVisits)
                    .filter(([eventId, visitDetails]) => {
                        return visitDetails && eventId !== eventOwner.id && visitDetails.arrived;
                    })
                    .map(([, visitDetails]) => visitDetails);

                const matchingReservations = reservations.value.filter(
                    matchesProperty("guestContact", guest.contact),
                );
                const tableLabels = matchingReservations.map(property("tableLabel"));

                return {
                    contact: guest.contact,
                    id: guest.id,
                    name: guest.name,
                    tableLabels,
                    visits: visitsWithoutCurrentEvent,
                };
            })
            .filter((guest) => guest.visits.length > 0);
    });

    return {
        returningGuests,
    };
}
