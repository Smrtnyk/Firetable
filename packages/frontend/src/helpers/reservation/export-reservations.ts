import type { ReservationDoc, FloorDoc } from "@firetable/types";
import { isAWalkInReservation } from "@firetable/types";
import { exportFile } from "quasar";

interface ExportReservationsParams {
    reservations: ReservationDoc[];
    eventName: string;
    floors: FloorDoc[];
}

export function exportReservations({ reservations, eventName }: ExportReservationsParams): void {
    // Create CSV content
    const headers = ["Table", "Guest Name", "Guest Contact", "Time", "Status", "Notes"].join(",");

    const rows = reservations.map(function (reservation) {
        const tableLabels = Array.isArray(reservation.tableLabel)
            ? reservation.tableLabel.join("+")
            : reservation.tableLabel;

        return [
            tableLabels,
            reservation.guestName || "",
            reservation.guestContact ?? "",
            reservation.time || "",
            getReservationStatus(reservation),
            // Replace commas in notes to prevent CSV issues
            (reservation.reservationNote ?? "").replaceAll(",", ";"),
        ].join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `${eventName}_reservations_${date}.csv`;

    exportFile(filename, blob);
}

function getReservationStatus(reservation: ReservationDoc): string {
    if (isAWalkInReservation(reservation)) {
        return "Arrived";
    }

    if (reservation.cancelled) {
        return "Cancelled";
    }
    if (reservation.arrived) {
        return "Arrived";
    }
    if (reservation.reservationConfirmed) {
        return "Confirmed";
    }
    if (reservation.waitingForResponse) {
        return "Waiting";
    }
    return "Pending";
}
