<script setup lang="ts">
interface Props {
    title: string;
    subtitle?: string;
}
const { title, subtitle } = defineProps<Props>();
</script>

<template>
    <q-card class="ft-card q-pa-sm q-mb-md">
        <div class="FTTitle items-center">
            <div>
                <h3 class="ft-title q-ma-none">{{ title }}</h3>
                <h6 v-if="subtitle" class="ft-subtitle q-ma-none">
                    {{ subtitle }}
                </h6>
            </div>

            <div class="text-right ft-title__right">
                <slot name="right" />
            </div>
        </div>
    </q-card>
</template>

<style lang="scss">
.FTTitle {
    display: grid;
    grid-template-columns: 1fr auto;
}
.ft-title {
    font-size: 2rem;
    color: #2d3748;
    font-weight: 900;
    padding-left: 0.75rem;

    &__right {
        padding-right: 0.75rem;
    }
}
.ft-subtitle {
    color: #8795a4;
    font-size: 1rem;
    font-weight: 400;
    padding-left: 0.75rem;
}
.body--dark {
    .ft-title {
        color: #fff;
    }
}
</style>
