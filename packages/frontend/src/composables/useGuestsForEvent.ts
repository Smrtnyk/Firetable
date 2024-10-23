import type { EventOwner } from "@firetable/backend";
import type { Query } from "firebase/firestore";
import type { GuestDoc, ReservationDoc } from "@firetable/types";
import type { Ref } from "vue";
import { computed } from "vue";
import { guestsCollection } from "@firetable/backend";
import { where } from "firebase/firestore";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";
import { matchesProperty, property } from "es-toolkit/compat";

export function useGuestsForEvent(eventOwner: EventOwner, reservations: Ref<ReservationDoc[]>) {
    const guestWithPhoneNumbers = computed<string[]>(function () {
        const values = reservations.value
            .map(property("guestContact"))
            .filter(Boolean)
            // Limit to 30 contacts due to Firestore 'in' query constraint
            .slice(0, 30);
        return Array.from(new Set(values));
    });

    const guestsQuery = computed<Query<GuestDoc> | null>(function () {
        if (guestWithPhoneNumbers.value.length > 0) {
            return createQuery(
                guestsCollection(eventOwner.organisationId),
                where("contact", "in", guestWithPhoneNumbers.value),
            );
        }
        return null;
    });

    const { data } = useFirestoreCollection<GuestDoc>(guestsQuery, { wait: true, once: true });

    // Compute recurring guests without current eventId from eventOwner
    const returningGuests = computed(function () {
        return data.value
            .map(function (guest) {
                const currentPropertyVisits = guest.visitedProperties[eventOwner.propertyId] ?? {};

                // Filter out the visits for the current event and create a new visits array
                // and filter out the visits where the guest has not arrived
                const visitsWithoutCurrentEvent = Object.entries(currentPropertyVisits)
                    .filter(function ([eventId, visitDetails]) {
                        return visitDetails && eventId !== eventOwner.id && visitDetails.arrived;
                    })
                    .map(([, visitDetails]) => visitDetails);

                // Find matching reservations for each visit based on contact
                const matchingReservations = reservations.value.filter(
                    matchesProperty("guestContact", guest.contact),
                );
                // Map table labels from matching reservations
                const tableLabels = matchingReservations.map(property("tableLabel"));

                return {
                    id: guest.id,
                    name: guest.name,
                    contact: guest.contact,
                    visits: visitsWithoutCurrentEvent,
                    tableLabels,
                };
            })
            .filter(function (guest) {
                return guest.visits.length > 0;
            });
    });

    return {
        guestsData: data,
        returningGuests,
    };
}
