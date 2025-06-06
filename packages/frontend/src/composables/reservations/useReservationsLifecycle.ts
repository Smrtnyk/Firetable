import type { FloorViewer } from "@firetable/floor-creator";
import type { EventDoc, ReservationDoc } from "@firetable/types";
import type { EventOwner } from "src/db";
import type { ComputedRef, Ref } from "vue";

import { matchesProperty } from "es-toolkit/compat";
import { ONE_MINUTE } from "src/constants";
import { shouldMarkReservationAsExpired } from "src/helpers/reservation/should-mark-reservation-as-expired";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onBeforeUnmount, watch } from "vue";

export function useReservationsLifecycle(
    eventDate: ComputedRef<EventDoc["date"] | undefined>,
    reservations: Ref<ReservationDoc[]>,
    floorInstances: Ref<FloorViewer[]>,
    eventOwner: EventOwner,
): void {
    let intervalID: ReturnType<typeof globalThis.setInterval> | undefined;

    const propertiesStore = usePropertiesStore();

    const propertySettings = computed(function () {
        return propertiesStore.getPropertySettingsById(eventOwner.propertyId);
    });

    watch(
        propertySettings,
        function (settingsValue) {
            if (intervalID !== undefined) {
                globalThis.clearInterval(intervalID);
                intervalID = undefined;
            }

            // Enabled only if greater than 0
            if (settingsValue.markGuestAsLateAfterMinutes > 0) {
                checkReservationsForTimeAndMarkTableIfNeeded();
                intervalID = globalThis.setInterval(
                    checkReservationsForTimeAndMarkTableIfNeeded,
                    ONE_MINUTE,
                );
            }
        },
        { immediate: true },
    );

    onBeforeUnmount(function () {
        if (intervalID !== undefined) {
            globalThis.clearInterval(intervalID);
            intervalID = undefined;
        }
    });

    function checkReservationsForTimeAndMarkTableIfNeeded(): void {
        if (!eventDate.value) {
            return;
        }

        const baseEventDate = new Date(eventDate.value);

        reservations.value
            .filter(function (reservation) {
                return (
                    !reservation.arrived &&
                    shouldMarkReservationAsExpired(
                        reservation.time,
                        baseEventDate,
                        propertySettings.value.timezone,
                        propertySettings.value.markGuestAsLateAfterMinutes * ONE_MINUTE,
                    )
                );
            })
            .forEach(function (reservation) {
                if (Array.isArray(reservation.tableLabel)) {
                    reservation.tableLabel.forEach(function (label) {
                        markReservationAsExpired(reservation.floorId, label);
                    });
                } else {
                    markReservationAsExpired(reservation.floorId, reservation.tableLabel);
                }
            });
    }

    function markReservationAsExpired(floorId: string, tableLabel: string): void {
        const floor = floorInstances.value.find(matchesProperty("id", floorId));
        const table = floor?.getTableByLabel(tableLabel);
        table?.setFill("red");
    }
}
