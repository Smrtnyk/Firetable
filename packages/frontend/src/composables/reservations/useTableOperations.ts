import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import type { AnyFunction, QueuedReservationDoc, ReservationDoc } from "@firetable/types";

import { useQuasar } from "quasar";
import { showConfirm } from "src/helpers/ui-helpers";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

export const enum TableOperationType {
    RESERVATION_COPY = 1,
    RESERVATION_DEQUEUE = 3,
    RESERVATION_LINK = 4,
    RESERVATION_TRANSFER = 2,
}

export interface ReservationCopyOperation {
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
    type: TableOperationType.RESERVATION_COPY;
}

export interface ReservationDequeueOperation {
    reservation: QueuedReservationDoc;
    type: TableOperationType.RESERVATION_DEQUEUE;
}

export interface ReservationLinkOperation {
    sourceFloor: FloorViewer;
    sourceReservation: ReservationDoc;
    type: TableOperationType.RESERVATION_LINK;
}

export interface ReservationTransferOperation {
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
    type: TableOperationType.RESERVATION_TRANSFER;
}

export type TableOperation =
    | ReservationCopyOperation
    | ReservationDequeueOperation
    | ReservationLinkOperation
    | ReservationTransferOperation;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useTableOperations() {
    const quasar = useQuasar();

    const currentTableOperation = ref<TableOperation | undefined>();
    let operationNotification: AnyFunction | undefined;
    const { t } = useI18n();

    const ongoingTableOperation = computed(() => currentTableOperation.value);

    const tableOperationWatcher = watch(currentTableOperation, function (newOperation) {
        if (newOperation) {
            showOperationNotification(newOperation);
        } else if (operationNotification) {
            // Dismiss the notification if the operation is cleared
            operationNotification();
            operationNotification = undefined;
        }
    });

    onBeforeUnmount(function () {
        tableOperationWatcher();
        // Clean up any remaining notification
        if (operationNotification) {
            operationNotification();
            operationNotification = undefined;
        }
    });

    function cancelCurrentOperation(): void {
        currentTableOperation.value = undefined;
    }

    function initiateTableOperation(operation: TableOperation): void {
        currentTableOperation.value = operation;
    }

    function showOperationNotification(operation: TableOperation): void {
        let message;
        switch (operation.type) {
            case TableOperationType.RESERVATION_COPY:
                message = t("useReservations.copyingReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            case TableOperationType.RESERVATION_DEQUEUE:
                message = t("useReservations.movingReservationOperationMsg");
                break;
            case TableOperationType.RESERVATION_LINK:
                message = t("useReservations.linkingTableOperationMsg", {
                    tableLabels: Array.isArray(operation.sourceReservation.tableLabel)
                        ? operation.sourceReservation.tableLabel.join(", ")
                        : operation.sourceReservation.tableLabel,
                });
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                message = t("useReservations.transferringReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            default:
                throw new Error("Invalid table operation type!");
        }

        operationNotification = quasar.notify({
            actions: [
                {
                    color: "white",
                    handler: onCancelOperation,
                    label: t("Global.cancel"),
                    noDismiss: true,
                },
            ],
            message,
            position: "top",
            timeout: 0,
            type: "ongoing",
        });
    }

    async function onCancelOperation(): Promise<void> {
        const confirm = await showConfirm(
            t("useReservations.cancelTableOperationTitle"),
            t("useReservations.cancelTableOperationMsg"),
        );

        if (confirm) {
            // This will also dismiss the notification
            cancelCurrentOperation();
        }
    }

    function initiateReservationLink(floor: FloorViewer, reservation: ReservationDoc): void {
        currentTableOperation.value = {
            sourceFloor: floor,
            sourceReservation: reservation,
            type: TableOperationType.RESERVATION_LINK,
        };
    }

    function initiateReservationCopy(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            sourceFloor: floor,
            sourceTable: table,
            type: TableOperationType.RESERVATION_COPY,
        };
    }

    function initiateReservationTransfer(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            sourceFloor: floor,
            sourceTable: table,
            type: TableOperationType.RESERVATION_TRANSFER,
        };
    }

    return {
        cancelCurrentOperation,
        initiateReservationCopy,
        initiateReservationLink,
        initiateReservationTransfer,
        initiateTableOperation,
        ongoingTableOperation,
    };
}
