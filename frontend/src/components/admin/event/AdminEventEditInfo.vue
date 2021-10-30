<template>
    <q-input v-model="localEventInfoValue" filled autogrow />
    <q-btn @click="saveEventInfo">Save event info</q-btn>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { updateEventProperty } from "src/services/firebase/db-events";
import { showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";

interface Props {
    eventId: string;
    eventInfo: string;
}

const props = defineProps<Props>();
const localEventInfoValue = ref(props.eventInfo);

function saveEventInfo(): void {
    tryCatchLoadingWrapper(() => {
        return updateEventProperty(props.eventId, "info", localEventInfoValue.value);
    }).catch(showErrorMessage);
}
</script>
