<script setup lang="ts">
import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { QScrollAreaProps } from "quasar";
import { ADMIN } from "@firetable/types";
import { computed, ref, useTemplateRef } from "vue";
import { QScrollArea } from "quasar";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { useI18n } from "vue-i18n";
import FTCenteredText from "src/components/FTCenteredText.vue";

export interface AdminEventLogsProps {
    logsDoc: EventLogsDoc | null | undefined;
    isAdmin: boolean;
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
        return log.creator.role !== ADMIN;
    });
});
const showScrollButton = ref(false);
const logsContainer = useTemplateRef<QScrollArea>("logsContainer");

function getIconNameForLogEntry(logMessage: string): string {
    if (logMessage.includes("deleted")) {
        return "trash";
    }

    if (logMessage.includes("transferred")) {
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

    return "";
}

function formatSubtitleForEventLog({ creator, timestamp }: EventLog): string {
    const datePart = getFormatedDateFromTimestamp(timestamp, locale.value);
    const userPart = `${creator.name} (${creator.email})`;
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
    <div class="AdminEventLogs">
        <div v-if="logs.length > 0">
            <q-scroll-area ref="logsContainer" class="logs-container" @scroll="handleScroll">
                <q-timeline color="primary">
                    <q-timeline-entry
                        v-for="log of logs"
                        :key="log.timestamp.toString()"
                        :subtitle="formatSubtitleForEventLog(log)"
                        :icon="getIconNameForLogEntry(log.message)"
                    >
                        <div>
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
    </div>
</template>

<style lang="scss">
.logs-container {
    height: calc(100vh - 200px);
    margin-bottom: 16px;

    .q-scrollarea__container {
        padding-left: 16px !important;
    }
}
.scroll-to-bottom {
    z-index: 999999;
}
</style>
