<template>
    <v-textarea v-model="localEventInfoValue" variant="filled" auto-grow />
    <v-btn rounded class="button-gradient mt-2" @click="saveEventInfo">
        <v-icon start>fas fa-save</v-icon>
        {{ t("AdminEventEditInfo.saveButtonLabel") }}
    </v-btn>
</template>

<script setup lang="ts">
import type { EventOwner } from "src/db";

import { updateEvent } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    eventInfo: string;
    eventOwner: EventOwner;
}

const props = defineProps<Props>();
const { t } = useI18n();
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
