import type { EventOwner } from "@firetable/backend";
import { eventEmitter } from "src/boot/event-emitter";
import { addLogToEvent } from "@firetable/backend";
import { AppLogger } from "src/logger/FTLogger";
import { useAuthStore } from "src/stores/auth-store";

eventEmitter.on("reservation:created", function ({ reservation, eventOwner }) {
    createEventLog(`Reservation created on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:updated", function ({ reservation, eventOwner }) {
    createEventLog(`Reservation edited on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:deleted", function ({ reservation, eventOwner }) {
    createEventLog(`Reservation deleted on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:deleted:soft", function ({ reservation, eventOwner }) {
    createEventLog(`Reservation soft deleted on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:copied", function ({ sourceReservation, targetTable, eventOwner }) {
    createEventLog(
        `Reservation copied from table ${sourceReservation.tableLabel} to table ${targetTable.label}`,
        eventOwner,
    );
});

eventEmitter.on("reservation:transferred", function ({ fromTable, toTable, eventOwner }) {
    createEventLog(
        `Reservation transferred from table ${fromTable.label} to table ${toTable.label}`,
        eventOwner,
    );
});

function createEventLog(message: string, eventOwner: EventOwner): void {
    const authStore = useAuthStore();
    const user = authStore.nonNullableUser;
    addLogToEvent(eventOwner, message, user).catch(AppLogger.error.bind(AppLogger));
}
