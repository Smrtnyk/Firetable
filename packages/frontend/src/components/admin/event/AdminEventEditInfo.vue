<template>
    <div>
        <v-textarea v-model="localEventInfoValue" variant="filled" auto-grow label="Event Info" />
        <v-btn
            rounded
            class="button-gradient mt-2"
            prepend-icon="fa fa-save"
            @click="saveEventInfo"
        >
            Save
        </v-btn>
    </div>
</template>

<script setup lang="ts">
import type { EventOwner } from "src/db";

import { updateEvent } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ref } from "vue";

interface Props {
    eventInfo: string;
    eventOwner: EventOwner;
}

const props = defineProps<Props>();
const localEventInfoValue = ref(props.eventInfo);

async function saveEventInfo(): Promise<void> {
    await tryCatchLoadingWrapper({
        hook() {
            return updateEvent(props.eventOwner, {
                info: localEventInfoValue.value,
            });
        },
    });
}
</script>
