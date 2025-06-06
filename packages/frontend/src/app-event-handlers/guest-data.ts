import type { EventDoc, GuestDataPayload, Reservation } from "@firetable/types";
import type { EventOwner } from "src/db";

import { isPlannedReservation } from "@firetable/types";
import { eventEmitter } from "src/boot/event-emitter";
import { deleteGuestVisit, setGuestData } from "src/db";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { AppLogger } from "src/logger/FTLogger";
import { useGuestsStore } from "src/stores/guests-store";
import { usePropertiesStore } from "src/stores/properties-store";

const enum GuestDataMode {
    DELETE = "delete",
    SET = "set",
}

eventEmitter.on("reservation:created", function ({ event, eventOwner, reservation }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:arrived", function ({ event, eventOwner, reservation }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:cancelled", function ({ event, eventOwner, reservation }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:deleted", function ({ event, eventOwner, reservation }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.DELETE).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on(
    "reservation:updated",
    function ({ event, eventOwner, oldReservation, reservation }) {
        const contactAdded = !oldReservation.guestContact && reservation.guestContact;
        const contactChanged = oldReservation.guestContact !== reservation.guestContact;

        if (contactAdded) {
            handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
                AppLogger.error.bind(AppLogger),
            );
        } else if (contactChanged) {
            handleGuestDataForReservation(
                oldReservation,
                event,
                eventOwner,
                GuestDataMode.DELETE,
            ).catch(AppLogger.error.bind(AppLogger));
            handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
                AppLogger.error.bind(AppLogger),
            );
        }
    },
);

async function handleGuestDataForReservation(
    reservationData: Reservation,
    event: EventDoc,
    eventOwner: EventOwner,
    mode: GuestDataMode,
): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const guestsStore = useGuestsStore();
    const settings = propertiesStore.getPropertySettingsById(eventOwner.propertyId);

    if (!settings.guest.collectGuestData) {
        return;
    }

    if (!reservationData.guestContact || !reservationData.guestName) {
        return;
    }

    const data: GuestDataPayload = {
        eventDate: event.date,
        eventId: eventOwner.id,
        eventName: event.name,
        organisationId: eventOwner.organisationId,
        preparedGuestData: {
            arrived: reservationData.arrived,
            cancelled: isPlannedReservation(reservationData) ? reservationData.cancelled : false,
            contact: reservationData.guestContact,
            guestName: reservationData.guestName,
            hashedContact: await hashString(reservationData.guestContact),
            isVIP: reservationData.isVIP,
            maskedContact: maskPhoneNumber(reservationData.guestContact),
        },
        propertyId: eventOwner.propertyId,
    };

    function invalidateCache(): void {
        guestsStore.invalidateGuestCache(data.preparedGuestData.hashedContact);
    }

    if (mode === GuestDataMode.SET) {
        setGuestData(data).then(invalidateCache).catch(AppLogger.error.bind(AppLogger));
    } else {
        deleteGuestVisit(data).then(invalidateCache).catch(AppLogger.error.bind(AppLogger));
    }
}
