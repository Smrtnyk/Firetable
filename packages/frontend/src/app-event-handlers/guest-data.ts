import type { EventDoc, GuestDataPayload, Reservation } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { AppLogger } from "src/logger/FTLogger";
import { eventEmitter } from "src/boot/event-emitter";
import { isPlannedReservation } from "@firetable/types";
import { hashString } from "src/helpers/hash-string";
import { maskPhoneNumber } from "src/helpers/mask-phone-number";
import { deleteGuestVisit, setGuestData } from "@firetable/backend";
import { usePropertiesStore } from "src/stores/properties-store";
import { useGuestsStore } from "src/stores/guests-store";

const enum GuestDataMode {
    SET = "set",
    DELETE = "delete",
}

eventEmitter.on("reservation:created", function ({ reservation, eventOwner, event }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:arrived", function ({ reservation, eventOwner, event }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:cancelled", function ({ reservation, eventOwner, event }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.SET).catch(
        AppLogger.error.bind(AppLogger),
    );
});

eventEmitter.on("reservation:deleted", function ({ reservation, eventOwner, event }) {
    handleGuestDataForReservation(reservation, event, eventOwner, GuestDataMode.DELETE).catch(
        AppLogger.error.bind(AppLogger),
    );
});

async function handleGuestDataForReservation(
    reservationData: Reservation,
    event: EventDoc,
    eventOwner: EventOwner,
    mode: GuestDataMode,
): Promise<void> {
    const propertiesStore = usePropertiesStore();
    const guestsStore = useGuestsStore();
    const settings = propertiesStore.getOrganisationSettingsById(eventOwner.organisationId);

    if (!settings.guest.collectGuestData) {
        return;
    }

    if (!reservationData.guestContact || !reservationData.guestName) {
        return;
    }

    const data: GuestDataPayload = {
        preparedGuestData: {
            contact: reservationData.guestContact,
            hashedContact: await hashString(reservationData.guestContact),
            maskedContact: maskPhoneNumber(reservationData.guestContact),
            guestName: reservationData.guestName,
            arrived: reservationData.arrived,
            cancelled: isPlannedReservation(reservationData) ? reservationData.cancelled : false,
            isVIP: reservationData.isVIP,
        },
        propertyId: eventOwner.propertyId,
        organisationId: eventOwner.organisationId,
        eventId: eventOwner.id,
        eventName: event.name,
        eventDate: event.date,
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
