<template>
    <q-input v-model="localEventInfoValue" filled autogrow />
    <q-btn
        rounded
        class="button-gradient q-mt-sm"
        icon="save"
        @click="saveEventInfo"
        label="Save"
    />
</template>

<script setup lang="ts">
import type { EventOwner } from "@firetable/backend";
import { ref } from "vue";
import { updateEvent } from "@firetable/backend";
import { withLoading } from "src/helpers/ui-helpers";

interface Props {
    eventOwner: EventOwner;
    eventInfo: string;
}

const props = defineProps<Props>();
const localEventInfoValue = ref(props.eventInfo);

const saveEventInfo = withLoading(function () {
    return updateEvent(props.eventOwner, {
        info: localEventInfoValue.value,
    });
});
</script>
