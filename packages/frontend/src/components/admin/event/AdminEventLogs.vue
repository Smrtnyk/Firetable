<script setup lang="ts">
import type { EventLog, EventLogsDoc } from "@firetable/types";
import { ADMIN } from "@firetable/types";
import { format } from "date-fns";
import { useAuthStore } from "src/stores/auth-store";
import { computed } from "vue";

interface Props {
    logsDoc: EventLogsDoc;
}
const props = defineProps<Props>();
const autStore = useAuthStore();
const logs = computed(() => {
    if (autStore.user?.role === ADMIN) {
        return props.logsDoc.logs;
    }
    return props.logsDoc.logs.filter((log) => {
        return log.creator.role !== ADMIN;
    });
});

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

    return "";
}

function formatSubtitleForEventLog({ creator, timestamp }: EventLog): string {
    const datePart = formatTimestampToReadable(timestamp.toDate());
    const userPart = `${creator.name} (${creator.email})`;
    return `${datePart}, by ${userPart}`;
}
</script>

<template>
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
</template>
