<script setup lang="ts">
import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { QScrollAreaProps } from "quasar";
import { ADMIN } from "@firetable/types";
import { format } from "date-fns";
import { useAuthStore } from "src/stores/auth-store";
import { computed, ref } from "vue";
import { QScrollArea } from "quasar";

interface Props {
    logsDoc: EventLogsDoc;
}
const props = defineProps<Props>();
const authStore = useAuthStore();
const logs = computed(() => {
    if (authStore.user?.role === ADMIN) {
        return props.logsDoc.logs;
    }
    return props.logsDoc.logs.filter((log) => {
        return log.creator.role !== ADMIN;
    });
});
const showScrollButton = ref(false);
const logsContainer = ref<QScrollArea | undefined>();

function formatTimestampToReadable(date: Date): string {
    return format(date, "dd-MM-yyyy HH:mm:ss");
}

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
    const datePart = formatTimestampToReadable(timestamp.toDate());
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
    <q-scroll-area ref="logsContainer" class="logs-container" @scroll="handleScroll">
        <q-timeline color="primary">
            <q-timeline-entry
                v-for="log of logs"
                :key="log.timestamp.nanoseconds"
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
