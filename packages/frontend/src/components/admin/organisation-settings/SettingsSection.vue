<script lang="ts" setup>
interface Props {
    title: string;
}

const props = defineProps<Props>();
</script>

<template>
    <section class="row" :aria-label="props.title">
        <div class="col-6 column justify-center">
            {{ props.title }}
        </div>
        <div class="col-6">
            <slot />
        </div>
    </section>
</template>
