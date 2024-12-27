import type { BaseTable, FloorViewer } from "@firetable/floor-creator";
import type { AnyFunction, QueuedReservationDoc, ReservationDoc } from "@firetable/types";
import { showConfirm } from "src/helpers/ui-helpers";
import { useQuasar } from "quasar";
import { watch, ref, onBeforeUnmount, computed } from "vue";
import { useI18n } from "vue-i18n";

export const enum TableOperationType {
    RESERVATION_COPY = 1,
    RESERVATION_TRANSFER = 2,
    RESERVATION_DEQUEUE = 3,
    RESERVATION_LINK = 4,
}

export interface ReservationLinkOperation {
    type: TableOperationType.RESERVATION_LINK;
    sourceFloor: FloorViewer;
    sourceReservation: ReservationDoc;
}

export interface ReservationCopyOperation {
    type: TableOperationType.RESERVATION_COPY;
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
}

export interface ReservationTransferOperation {
    type: TableOperationType.RESERVATION_TRANSFER;
    sourceFloor: FloorViewer;
    sourceTable: BaseTable;
}

export interface ReservationDequeueOperation {
    type: TableOperationType.RESERVATION_DEQUEUE;
    reservation: QueuedReservationDoc;
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

    const tableOperationWatcher = watch(currentTableOperation, (newOperation) => {
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
            case TableOperationType.RESERVATION_DEQUEUE:
                message = t("useReservations.movingReservationOperationMsg");
                break;
            case TableOperationType.RESERVATION_COPY:
                message = t("useReservations.copyingReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            case TableOperationType.RESERVATION_TRANSFER:
                message = t("useReservations.transferringReservationOperationMsg", {
                    tableLabel: operation.sourceTable.label,
                });
                break;
            case TableOperationType.RESERVATION_LINK:
                message = t("useReservations.linkingTableOperationMsg", {
                    tableLabels: Array.isArray(operation.sourceReservation.tableLabel)
                        ? operation.sourceReservation.tableLabel.join(", ")
                        : operation.sourceReservation.tableLabel,
                });
                break;
            default:
                throw new Error("Invalid table operation type!");
        }

        operationNotification = quasar.notify({
            message,
            type: "ongoing",
            timeout: 0,
            position: "top",
            actions: [
                {
                    label: t("Global.cancel"),
                    color: "white",
                    noDismiss: true,
                    handler: onCancelOperation,
                },
            ],
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
            type: TableOperationType.RESERVATION_LINK,
            sourceFloor: floor,
            sourceReservation: reservation,
        };
    }

    function initiateReservationCopy(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            type: TableOperationType.RESERVATION_COPY,
            sourceFloor: floor,
            sourceTable: table,
        };
    }

    function initiateReservationTransfer(floor: FloorViewer, table: BaseTable): void {
        currentTableOperation.value = {
            type: TableOperationType.RESERVATION_TRANSFER,
            sourceFloor: floor,
            sourceTable: table,
        };
    }

    return {
        ongoingTableOperation,
        initiateTableOperation,
        cancelCurrentOperation,
        initiateReservationLink,
        initiateReservationTransfer,
        initiateReservationCopy,
    };
}
