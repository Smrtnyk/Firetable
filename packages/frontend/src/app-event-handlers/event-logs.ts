import type { ReservationDoc, ReservationLogEntry, TransferDetails } from "@firetable/types";
import type { EventOwner } from "@firetable/backend";
import { ReservationAction, TransferType } from "@firetable/types";
import { addStructuredLogToEvent } from "@firetable/backend";
import { AppLogger } from "src/logger/FTLogger";
import { eventEmitter } from "src/boot/event-emitter";

eventEmitter.on("reservation:transferred", function (params) {
    const {
        sourceTableLabel,
        targetTableLabel,
        sourceFloor,
        targetFloor,
        targetReservation,
        sourceReservation,
        user,
        eventOwner,
    } = params;

    const transferDetails: TransferDetails = {
        type: targetReservation ? TransferType.SWAP : TransferType.EMPTY_TABLE,
        isCrossFloor: sourceFloor.id !== targetFloor.id,
        sourceTable: {
            label: sourceTableLabel,
            floorId: sourceFloor.id,
            floorName: sourceFloor.name,
        },
        targetTable: {
            label: targetTableLabel,
            floorId: targetFloor.id,
            floorName: targetFloor.name,
        },
        ...(targetReservation && {
            targetReservation: {
                id: targetReservation.id,
                guestName: targetReservation.guestName,
            },
        }),
    };

    createLog(
        {
            action: ReservationAction.TRANSFER,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceFloor.id,
            tableLabel: sourceTableLabel,
            transferDetails,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:created", function (data) {
    const { sourceReservation, user, eventOwner } = data;

    createLog(
        {
            action: ReservationAction.CREATE,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

eventEmitter.on(
    "reservation:updated",
    function ({ newReservation, sourceReservation, user, eventOwner }) {
        const changes = generateReservationDiff(sourceReservation, newReservation);

        createLog(
            {
                action: ReservationAction.UPDATE,
                creator: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                reservationId: newReservation.id,
                floorId: newReservation.floorId,
                tableLabel: newReservation.tableLabel,
                guestName: newReservation.guestName,
                numberOfGuests: newReservation.numberOfGuests,
                changes: changes.structuredDiff,
            },
            eventOwner,
        );
    },
);

eventEmitter.on("reservation:deleted", function ({ sourceReservation, user, eventOwner }) {
    createLog(
        {
            action: ReservationAction.DELETE,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:deleted:soft", function ({ sourceReservation, user, eventOwner }) {
    createLog(
        {
            action: ReservationAction.SOFT_DELETE,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:copied", function (params) {
    const { sourceReservation, targetTable, targetFloor, user, eventOwner } = params;

    createLog(
        {
            action: ReservationAction.COPY,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
            transferDetails: {
                type: TransferType.EMPTY_TABLE,
                isCrossFloor: sourceReservation.floorId !== targetFloor.id,
                sourceTable: {
                    label: sourceReservation.tableLabel as string,
                    floorId: sourceReservation.floorId,
                    // Currently copy only allowed on same floors
                    floorName: targetFloor.name,
                },
                targetTable: {
                    label: targetTable.label,
                    floorId: targetFloor.id,
                    floorName: targetFloor.name,
                },
            },
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:linked", function (params) {
    const { sourceReservation, linkedTableLabel, eventOwner, user } = params;

    createLog(
        {
            action: ReservationAction.LINK,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
            linkedTableLabel,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:unlinked", function (params) {
    const { sourceReservation, user, eventOwner } = params;

    createLog(
        {
            action: ReservationAction.UNLINK,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:arrived", function (data) {
    const { sourceReservation, user, eventOwner } = data;

    createLog(
        {
            action: ReservationAction.GUEST_ARRIVED,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

eventEmitter.on("reservation:cancelled", function (data) {
    const { sourceReservation, user, eventOwner } = data;

    createLog(
        {
            action: ReservationAction.CANCEL,
            creator: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            reservationId: sourceReservation.id,
            floorId: sourceReservation.floorId,
            tableLabel: sourceReservation.tableLabel,
            guestName: sourceReservation.guestName,
            numberOfGuests: sourceReservation.numberOfGuests,
        },
        eventOwner,
    );
});

function createLog(logEntry: Omit<ReservationLogEntry, "timestamp">, eventOwner: EventOwner): void {
    addStructuredLogToEvent(eventOwner, logEntry).catch(function (error) {
        AppLogger.error("Error creating log entry:", error);
    });
}

function generateReservationDiff(
    oldReservation: ReservationDoc,
    newReservation: ReservationDoc,
): {
    textDiff: string;
    structuredDiff: { field: string; oldValue: any; newValue: any }[];
} {
    const relevantFields: (keyof ReservationDoc)[] = [
        "guestName",
        "guestContact",
        "numberOfGuests",
        "time",
        "reservationNote",
        "isVIP",
    ];

    const structuredDiff: { field: string; oldValue: any; newValue: any }[] = [];
    const changes: string[] = [];

    for (const field of relevantFields) {
        const oldValue = oldReservation[field];
        const newValue = newReservation[field];

        if (oldValue !== newValue) {
            const oldDisplay = oldValue ?? "none";
            const newDisplay = newValue ?? "none";

            changes.push(`• ${field}: ${oldDisplay} → ${newDisplay}`);
            structuredDiff.push({
                field,
                oldValue: oldDisplay,
                newValue: newDisplay,
            });
        }
    }

    return {
        textDiff: changes.length > 0 ? `\nChanges:\n${changes.join("\n")}` : "",
        structuredDiff,
    };
}
