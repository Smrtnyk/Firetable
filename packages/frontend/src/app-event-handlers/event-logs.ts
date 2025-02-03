import type { EventOwner } from "@firetable/backend";
import type { ReservationDoc } from "@firetable/types";

import { addLogToEvent } from "@firetable/backend";
import { eventEmitter } from "src/boot/event-emitter";
import { AppLogger } from "src/logger/FTLogger";
import { useAuthStore } from "src/stores/auth-store";

eventEmitter.on("reservation:created", function ({ eventOwner, reservation }) {
    createEventLog(`Reservation created on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:updated", function ({ eventOwner, oldReservation, reservation }) {
    const diff = generateReservationDiff(oldReservation, reservation);
    createEventLog(`Reservation edited on table ${reservation.tableLabel}${diff}`, eventOwner);
});

eventEmitter.on("reservation:deleted", function ({ eventOwner, reservation }) {
    createEventLog(`Reservation deleted on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:deleted:soft", function ({ eventOwner, reservation }) {
    createEventLog(`Reservation soft deleted on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:copied", function ({ eventOwner, sourceReservation, targetTable }) {
    createEventLog(
        `Reservation copied from table ${sourceReservation.tableLabel} to table ${targetTable.label}`,
        eventOwner,
    );
});

eventEmitter.on("reservation:transferred", function (data) {
    const { eventOwner, fromFloor, fromTable, targetReservation, toFloor, toTable } = data;

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

eventEmitter.on("reservation:arrived", function ({ eventOwner, reservation }) {
    createEventLog(`Guest arrived for reservation on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on("reservation:cancelled", function ({ eventOwner, reservation }) {
    createEventLog(`Reservation cancelled on table ${reservation.tableLabel}`, eventOwner);
});

eventEmitter.on(
    "reservation:linked",
    function ({ eventOwner, linkedTableLabel, sourceReservation }) {
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
    function ({ eventOwner, sourceReservation, unlinkedTableLabels }) {
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

function generateReservationDiff(
    oldReservation: ReservationDoc,
    newReservation: ReservationDoc,
): string {
    const relevantFields: (keyof ReservationDoc)[] = [
        "guestName",
        "guestContact",
        "numberOfGuests",
        "time",
        "reservationNote",
        "isVIP",
    ];

    const changes: string[] = [];

    for (const field of relevantFields) {
        const oldValue = oldReservation[field];
        const newValue = newReservation[field];

        if (oldValue !== newValue) {
            const oldDisplay = oldValue ?? "none";
            const newDisplay = newValue ?? "none";
            changes.push(`• ${field}: ${oldDisplay} → ${newDisplay}`);
        }
    }

    return changes.length > 0 ? `\nChanges:\n${changes.join("\n")}` : "";
}
