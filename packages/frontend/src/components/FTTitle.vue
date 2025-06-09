<script setup lang="ts">
import { useScreenDetection } from "src/global-reactives/screen-detection";
import { computed } from "vue";

interface Props {
    subtitle?: string;
    title: string;
}
const { subtitle, title } = defineProps<Props>();
const { isMobile } = useScreenDetection();

const titleClass = computed(() => {
    return isMobile.value ? "text-h6" : "text-h4";
});

const subtitleClass = computed(() => {
    return isMobile.value ? "text-subtitle2" : "text-subtitle1";
});
</script>

<template>
    <div class="pa-2 mb-4">
        <div class="FTTitle align-center">
            <div class="text-left ft-title__left">
                <slot name="left" />
            </div>

            <div>
                <h3 aria-level="3" :class="['ft-title', 'my-0', titleClass]">
                    {{ title }}
                </h3>
                <h6 v-if="subtitle" :class="['ft-subtitle', 'my-0', subtitleClass]">
                    {{ subtitle }}
                </h6>
            </div>

            <div class="text-right ft-title__right">
                <slot name="right" />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.FTTitle {
    display: grid;
    grid-template-columns: auto 1fr auto;
}

.ft-title {
    color: #2d3748;
    font-weight: 600;
}

.ft-subtitle {
    color: #8795a4;
    font-weight: 400;
    padding-left: 0.75rem;
}

.v-theme--dark {
    .ft-title {
        color: #fff;
    }
}
</style>
