<script lang="ts" setup>
interface Props {
    title: string;
}

const props = defineProps<Props>();
</script>

<template>
    <section class="row" role="region" :aria-label="props.title">
        <div class="col-xs-8 col-sm-10 column justify-center">
            {{ props.title }}
        </div>
        <div class="col-xs-4 col-sm-2">
            <slot />
        </div>
    </section>
</template>
