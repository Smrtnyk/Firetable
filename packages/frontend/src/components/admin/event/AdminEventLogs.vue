<script setup lang="ts">
import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { QScrollAreaProps } from "quasar";

import { AdminRole } from "@firetable/types";
import { QScrollArea } from "quasar";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { computed, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";

export interface AdminEventLogsProps {
    isAdmin: boolean;
    logsDoc: EventLogsDoc | null | undefined;
    timezone: string;
}
const props = defineProps<AdminEventLogsProps>();
const { locale } = useI18n();
const logs = computed(function () {
    if (!props.logsDoc) {
        return [];
    }
    if (props.isAdmin) {
        return props.logsDoc.logs;
    }
    return props.logsDoc.logs.filter(function (log) {
        return log.creator.role !== AdminRole.ADMIN;
    });
});
const showScrollButton = ref(false);
const logsContainer = useTemplateRef<QScrollArea>("logsContainer");

function formatSubtitleForEventLog({ creator, timestamp }: EventLog): string {
    const datePart = getFormatedDateFromTimestamp(timestamp, locale.value, props.timezone);
    const userPart = `${creator.name} (${creator.email})`;
    return `${datePart}, by ${userPart}`;
}

function getIconNameForLogEntry(logMessage: string): string {
    if (logMessage.includes("unlinked")) {
        return "unlink";
    }

    if (logMessage.includes("linked")) {
        return "link";
    }
    if (logMessage.includes("deleted")) {
        return "trash";
    }

    if (logMessage.includes("transferred") || logMessage.includes("swapped")) {
        return "transfer";
    }

    if (logMessage.includes("created")) {
        return "plus";
    }

    if (logMessage.includes("edited")) {
        return "pencil";
    }

    if (logMessage.includes("copied")) {
        return "copy";
    }

    if (logMessage.includes("arrived")) {
        return "check";
    }

    if (logMessage.includes("cancelled")) {
        return "close";
    }

    return "";
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
                        :icon="getIconNameForLogEntry(log.message)"
                    >
                        <div class="whitespace-pre-line">
                            {{ log.message }}
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
