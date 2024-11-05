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

eventEmitter.on("reservation:transferred", function (data) {
    const { fromTable, toTable, eventOwner, fromFloor, toFloor, targetReservation } = data;

    let message = "";

    // Cross-floor operation
    if (fromFloor && toFloor && fromFloor !== toFloor) {
        message = targetReservation
            ? `Reservation swapped between table ${fromTable.label} (${fromFloor}) and table ${toTable.label} (${toFloor})`
            : `Reservation transferred from table ${fromTable.label} (${fromFloor}) to empty table ${toTable.label} (${toFloor})`;
    }
    // Same floor operation
    else if (targetReservation) {
        message = `Reservation swapped between table ${fromTable.label} and table ${toTable.label}`;
    } else {
        message = `Reservation transferred from table ${fromTable.label} to empty table ${toTable.label}`;
    }

    createEventLog(message, eventOwner);
});

eventEmitter.on("reservation:arrived", function ({ reservation, eventOwner }) {
    createEventLog(`Guest arrived for reservation on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:cancelled", function ({ reservation, eventOwner }) {
    createEventLog(`Reservation cancelled on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on(
    "reservation:linked",
    function ({ sourceReservation, linkedTableLabel, eventOwner }) {
        createEventLog(
            `Table ${linkedTableLabel} linked to reservation on table ${
                Array.isArray(sourceReservation.tableLabel)
                    ? sourceReservation.tableLabel[0]
                    : sourceReservation.tableLabel
            }`,
            eventOwner,
        );
    },
);

eventEmitter.on(
    "reservation:unlinked",
    function ({ sourceReservation, unlinkedTableLabels, eventOwner }) {
        createEventLog(
            `Tables ${unlinkedTableLabels.join(", ")} unlinked from reservation on table ${
                Array.isArray(sourceReservation.tableLabel)
                    ? sourceReservation.tableLabel[0]
                    : sourceReservation.tableLabel
            }`,
            eventOwner,
        );
    },
);

function createEventLog(message: string, eventOwner: EventOwner): void {
    const authStore = useAuthStore();
    const user = authStore.nonNullableUser;
    addLogToEvent(eventOwner, message, user).catch(AppLogger.error.bind(AppLogger));
}
