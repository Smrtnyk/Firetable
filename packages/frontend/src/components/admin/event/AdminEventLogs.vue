<script setup lang="ts">
import type {
    EventLog,
    EventLogsDoc,
    ReservationLogEntry,
    FirestoreTimestamp,
} from "@firetable/types";
import type { QScrollAreaProps } from "quasar";
import { TransferType, ReservationAction, AdminRole } from "@firetable/types";
import { computed, ref, useTemplateRef } from "vue";
import { QScrollArea } from "quasar";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { isNumber } from "es-toolkit/compat";

export interface AdminEventLogsProps {
    logsDoc: EventLogsDoc | null | undefined;
    isAdmin: boolean;
    timezone: string;
}

const props = defineProps<AdminEventLogsProps>();
const { locale } = useI18n();

const logs = computed(function () {
    if (!props.logsDoc) {
        return [];
    }

    const legacyLogs = props.logsDoc.logs || [];
    const structuredLogs = props.logsDoc.structuredLogs ?? [];

    const combinedLogs = [...legacyLogs, ...structuredLogs].sort(
        (a, b) =>
            getMilisFromTimestampOrNumber(a.timestamp) - getMilisFromTimestampOrNumber(b.timestamp),
    );

    if (!props.isAdmin) {
        return combinedLogs.filter((log) => {
            return log.creator.role !== AdminRole.ADMIN;
        });
    }

    return combinedLogs;
});

const showScrollButton = ref(false);
const logsContainer = useTemplateRef<QScrollArea>("logsContainer");

function isStructuredLog(log: EventLog | ReservationLogEntry): log is ReservationLogEntry {
    return "action" in log;
}

function getMilisFromTimestampOrNumber(timestamp: FirestoreTimestamp | number): number {
    return isNumber(timestamp) ? timestamp : timestamp.toMillis();
}

function getIconForStructuredLog(log: ReservationLogEntry): string {
    switch (log.action) {
        case ReservationAction.UNLINK:
            return "unlink";
        case ReservationAction.LINK:
            return "link";
        case ReservationAction.DELETE:
        case ReservationAction.SOFT_DELETE:
            return "trash";
        case ReservationAction.TRANSFER:
            return "transfer";
        case ReservationAction.CREATE:
            return "plus";
        case ReservationAction.UPDATE:
            return "pencil";
        case ReservationAction.COPY:
            return "copy";
        case ReservationAction.GUEST_ARRIVED:
            return "check";
        case ReservationAction.CANCEL:
            return "close";
        default:
            return "";
    }
}

function getIconNameForLogEntry(log: EventLog | ReservationLogEntry): string {
    if (isStructuredLog(log)) {
        return getIconForStructuredLog(log);
    }

    const { message } = log;
    if (message.includes("unlinked")) return "unlink";
    if (message.includes("linked")) return "link";
    if (message.includes("deleted")) return "trash";
    if (message.includes("transferred") || message.includes("swapped")) return "transfer";
    if (message.includes("created")) return "plus";
    if (message.includes("edited")) return "pencil";
    if (message.includes("copied")) return "copy";
    if (message.includes("arrived")) return "check";
    if (message.includes("cancelled")) return "close";
    return "";
}

function formatTransferMessage(log: ReservationLogEntry): string {
    if (!log.transferDetails) return "Transfer details missing";
    const { type, isCrossFloor, sourceTable, targetTable } = log.transferDetails;

    if (isCrossFloor) {
        return type === TransferType.SWAP
            ? `Reservation swapped between table ${sourceTable.label} (${sourceTable.floorName}) and table ${targetTable.label} (${targetTable.floorName})`
            : `Reservation transferred from table ${sourceTable.label} (${sourceTable.floorName}) to empty table ${targetTable.label} (${targetTable.floorName})`;
    }

    return type === TransferType.SWAP
        ? `Reservation swapped between table ${sourceTable.label} and table ${targetTable.label}`
        : `Reservation transferred from table ${sourceTable.label} to empty table ${targetTable.label}`;
}

function formatUpdateMessage(log: ReservationLogEntry): string {
    let message = `Reservation edited on table ${log.tableLabel}`;
    if (log.changes && log.changes.length > 0) {
        const changesList = log.changes
            .map((change) => `• ${change.field}: ${change.oldValue} → ${change.newValue}`)
            .join("\n");
        message += `\nChanges:\n${changesList}`;
    }
    return message;
}

function formatCopyMessage(log: ReservationLogEntry): string {
    if (!log.transferDetails) return "Copy details missing";
    const { sourceTable, targetTable } = log.transferDetails;
    return `Reservation copied from table ${sourceTable.label} to table ${targetTable.label}`;
}

function formatLinkMessage(log: ReservationLogEntry): string {
    if (!log.linkedTableLabel) {
        return `Link operation missing details`;
    }

    return `Table ${log.linkedTableLabel} linked to table ${log.tableLabel}`;
}
function formatUnlinkMessage(log: ReservationLogEntry): string {
    if (!log.unlinkedTableLabels) {
        return `Tables unlinked from reservation on table ${Array.isArray(log.tableLabel) ? log.tableLabel[0] : log.tableLabel}`;
    }

    return `Tables ${log.unlinkedTableLabels.join(", ")} unlinked from reservation on table ${Array.isArray(log.tableLabel) ? log.tableLabel[0] : log.tableLabel}`;
}

function formatBasicTableMessage(action: string, log: ReservationLogEntry): string {
    return `${action} on table ${log.tableLabel}`;
}

function formatMessageForLog(log: EventLog | ReservationLogEntry): string {
    if (!isStructuredLog(log)) {
        return log.message;
    }

    switch (log.action) {
        case ReservationAction.TRANSFER:
            return formatTransferMessage(log);

        case ReservationAction.UPDATE:
            return formatUpdateMessage(log);

        case ReservationAction.COPY:
            return formatCopyMessage(log);

        case ReservationAction.LINK:
            return formatLinkMessage(log);

        case ReservationAction.UNLINK:
            return formatUnlinkMessage(log);

        case ReservationAction.CREATE:
            return formatBasicTableMessage("Reservation created", log);

        case ReservationAction.DELETE:
            return formatBasicTableMessage("Reservation deleted", log);

        case ReservationAction.SOFT_DELETE:
            return formatBasicTableMessage("Reservation soft deleted", log);

        case ReservationAction.GUEST_ARRIVED:
            return formatBasicTableMessage("Guest arrived for reservation", log);

        case ReservationAction.CANCEL:
            return formatBasicTableMessage("Reservation cancelled", log);

        default:
            return `Unhandled action type: ${log.action}`;
    }
}

function formatSubtitleForEventLog(log: EventLog | ReservationLogEntry): string {
    const datePart = getFormatedDateFromTimestamp(log.timestamp, locale.value, props.timezone);
    const userPart = `${log.creator.name} (${log.creator.email})`;
    return `${datePart}, by ${userPart}`;
}

function handleScroll(ev: Parameters<NonNullable<QScrollAreaProps["onScroll"]>>[0]): void {
    showScrollButton.value = ev.verticalPercentage > 0.1 && ev.verticalPercentage < 0.9;
}

function scrollToBottom(): void {
    logsContainer.value?.setScrollPosition(
        "vertical",
        logsContainer.value.getScroll().verticalSize,
        1000,
    );
}
</script>

<template>
    <q-card class="ft-card AdminEventLogs q-pa-sm">
        <div v-if="logs.length > 0">
            <q-scroll-area ref="logsContainer" class="logs-container" @scroll="handleScroll">
                <q-timeline color="primary" class="q-ml-sm q-mt-none">
                    <q-timeline-entry
                        v-for="log of logs"
                        :key="log.timestamp.toString()"
                        :subtitle="formatSubtitleForEventLog(log)"
                        :icon="getIconNameForLogEntry(log)"
                    >
                        <div class="whitespace-pre-line">
                            {{ formatMessageForLog(log) }}
                        </div>
                    </q-timeline-entry>
                </q-timeline>
            </q-scroll-area>

            <q-page-sticky
                v-if="showScrollButton"
                position="bottom"
                :offset="[18, 18]"
                class="scroll-to-bottom"
            >
                <q-btn @click="scrollToBottom" fab icon="chevron_down" color="secondary" />
            </q-page-sticky>
        </div>
        <FTCenteredText v-else>No logs recorded for this event.</FTCenteredText>
    </q-card>
</template>

<style lang="scss">
.logs-container {
    height: calc(100vh - 200px);
}
.scroll-to-bottom {
    z-index: 999999;
}
.whitespace-pre-line {
    white-space: pre-line;
}
</style>
