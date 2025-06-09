<script setup lang="ts">
import type { EventLog, EventLogsDoc } from "@firetable/types";

import { AdminRole } from "@firetable/types";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { getFormatedDateFromTimestamp } from "src/helpers/date-utils";
import { computed, ref } from "vue";
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
// Replaced useTemplateRef with a standard Vue ref for the container element
const logsContainer = ref<HTMLElement | null>(null);

function formatSubtitleForEventLog({ creator, timestamp }: EventLog): string {
    const datePart = getFormatedDateFromTimestamp(timestamp, locale.value, props.timezone);
    const userPart = `${creator.name} (${creator.email})`;
    return `${datePart}, by ${userPart}`;
}

function getIconNameForLogEntry(logMessage: string): string {
    if (logMessage.includes("unlinked")) {
        return "fas fa-unlink";
    }

    if (logMessage.includes("linked")) {
        return "fas fa-link";
    }
    if (logMessage.includes("deleted")) {
        return "fas fa-trash-alt";
    }

    if (logMessage.includes("transferred") || logMessage.includes("swapped")) {
        return "fas fa-exchange-alt";
    }

    if (logMessage.includes("created")) {
        return "fas fa-plus";
    }

    if (logMessage.includes("edited")) {
        return "fas fa-pencil-alt";
    }

    if (logMessage.includes("copied")) {
        return "far fa-copy";
    }

    if (logMessage.includes("arrived")) {
        return "fas fa-check";
    }

    if (logMessage.includes("cancelled")) {
        return "fas fa-times";
    }

    return "fas fa-info-circle";
}

// Rewritten for standard DOM scroll events
function handleScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;

    // Ensure we don't divide by zero if content is smaller than container
    const scrollableHeight = el.scrollHeight - el.clientHeight;
    if (scrollableHeight <= 0) {
        showScrollButton.value = false;
        return;
    }

    const verticalPercentage = el.scrollTop / scrollableHeight;
    showScrollButton.value = verticalPercentage > 0.1 && verticalPercentage < 0.9;
}

// Rewritten for standard DOM scroll methods
function scrollToBottom(): void {
    const el = logsContainer.value;
    if (!el) return;
    el.scrollTo({
        behavior: "smooth",
        top: el.scrollHeight,
    });
}
</script>

<template>
    <v-card class="ft-card admin-event-logs pa-2">
        <div v-if="logs.length > 0">
            <div ref="logsContainer" class="logs-container" @scroll="handleScroll">
                <v-timeline side="end" align="start" density="compact" class="mt-0">
                    <v-timeline-item
                        v-for="log of logs"
                        :key="log.timestamp.toString()"
                        dot-color="primary"
                        size="x-small"
                    >
                        <template #icon>
                            <v-icon :icon="getIconNameForLogEntry(log.message)" size="x-small" />
                        </template>
                        <div class="whitespace-pre-line text-body-2">
                            {{ log.message }}
                        </div>
                        <div class="text-caption text-grey-darken-1">
                            {{ formatSubtitleForEventLog(log) }}
                        </div>
                    </v-timeline-item>
                </v-timeline>
            </div>

            <v-fab
                v-if="showScrollButton"
                icon="fas fa-chevron-down"
                location="bottom end"
                size="small"
                app
                appear
                color="secondary"
                @click="scrollToBottom"
            ></v-fab>
        </div>
        <FTCenteredText v-else>No logs recorded for this event.</FTCenteredText>
    </v-card>
</template>

<style lang="scss" scoped>
/* position: relative is needed for the v-fab to be positioned correctly */
.admin-event-logs {
    position: relative;
}
.logs-container {
    height: calc(100vh - 200px);
    overflow-y: auto;
}
.whitespace-pre-line {
    white-space: pre-line;
}
</style>
