import type { EventOwner } from "@firetable/backend";
import type { Query } from "firebase/firestore";
import type { GuestDoc, ReservationDoc } from "@firetable/types";
import type { Ref, ComputedRef } from "vue";
import { computed } from "vue";
import { guestsCollection } from "@firetable/backend";
import { takeProp } from "@firetable/utils";
import { isValidEuropeanPhoneNumber } from "src/helpers/utils";
import { where } from "firebase/firestore";
import { createQuery, useFirestoreCollection } from "src/composables/useFirestore";

export function useGuests(eventOwner: EventOwner, reservations: Ref<ReservationDoc[]>) {
    const guestWithPhoneNumbers = computed(() => {
        const values = reservations.value
            .map(takeProp("guestContact"))
            .filter(isValidEuropeanPhoneNumber)
            .slice(0, 30); // Limit to 30 contacts due to Firestore 'in' query constraint
        return Array.from(new Set(values));
    });

    const guestsQuery: ComputedRef<Query<GuestDoc> | null> = computed(() => {
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
    const returningGuests = computed(() => {
        return data.value
            .map((guest) => {
                const currentPropertyVisits = guest.visitedProperties[eventOwner.propertyId] || {};

                // Filter out the visits for the current event and create a new visits array
                // and filter out the visits where the guest has not arrived
                const visitsWithoutCurrentEvent = Object.entries(currentPropertyVisits)
                    .filter(
                        ([eventId, visitDetails]) =>
                            visitDetails && eventId !== eventOwner.id && visitDetails.arrived,
                    )
                    .map(([, visitDetails]) => visitDetails);

                // Find matching reservations for each visit based on contact
                const matchingReservations = reservations.value.filter(
                    (reservation) => reservation.guestContact === guest.contact,
                );
                // Map table labels from matching reservations
                const tableLabels = matchingReservations.map(
                    (reservation) => reservation.tableLabel,
                );

                return {
                    name: guest.name,
                    contact: guest.contact,
                    visits: visitsWithoutCurrentEvent,
                    tableLabels,
                };
            })
            .filter((guest) => guest.visits.length > 0);
    });

    return {
        guestsData: data,
        returningGuests,
    };
}
