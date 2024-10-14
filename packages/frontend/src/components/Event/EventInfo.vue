<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useI18n } from "vue-i18n";

interface Props {
    eventInfo: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
</script>

<template>
    <div v-if="props.eventInfo">{{ props.eventInfo }}</div>
    <FTCenteredText v-else>{{ t("EventInfo.eventInfoEmptyMsg") }}</FTCenteredText>
</template>
