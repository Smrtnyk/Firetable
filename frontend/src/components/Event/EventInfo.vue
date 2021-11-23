<script setup lang="ts">
interface Props {
    eventInfo: string;
}

const props = defineProps<Props>();
</script>

<template>
    <div>{{ props.eventInfo }}</div>
</template>
