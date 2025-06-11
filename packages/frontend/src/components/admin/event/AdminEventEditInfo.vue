<template>
    <q-input v-model="localEventInfoValue" filled autogrow />
    <FTBtn
        rounded
        class="button-gradient q-mt-sm"
        icon="fa fa-save"
        @click="saveEventInfo"
        :label="t('AdminEventEditInfo.saveButtonLabel')"
    />
</template>

<script setup lang="ts">
import type { EventOwner } from "src/db";

import FTBtn from "src/components/FTBtn.vue";
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
