<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "src/stores/global-store";

const { globalLoading, globalLoadingMessage } = storeToRefs(useGlobalStore());
</script>

<template>
    <v-overlay v-model="globalLoading" class="global-loading-overlay" persistent :z-index="9999">
        <div class="loading-content d-flex flex-column align-center justify-center">
            <v-progress-circular indeterminate size="64" width="4" color="primary" class="mb-4" />

            <div
                v-if="globalLoadingMessage"
                class="loading-subtext text-body-2 text-center opacity-70"
            >
                {{ globalLoadingMessage }}
            </div>
        </div>
    </v-overlay>
</template>

<style lang="scss" scoped>
.global-loading-overlay {
    :deep(.v-overlay__content) {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: transparent;
    }

    :deep(.v-overlay__scrim) {
        background: rgba(var(--v-theme-background), 0.9);
        backdrop-filter: blur(4px);
    }
}

.loading-content {
    text-align: center;
    padding: 24px;
    border-radius: 12px;
}

.loading-text {
    color: rgb(var(--v-theme-on-surface));
    font-weight: 500;
    letter-spacing: 0.5px;
}

.loading-subtext {
    color: rgb(var(--v-theme-on-surface-variant));
    max-width: 250px;
    line-height: 1.4;
}

@media (max-width: 600px) {
    .loading-content {
        padding: 20px;
        margin: 16px;
    }

    .loading-text {
        font-size: 1.1rem;
    }

    .loading-subtext {
        font-size: 0.875rem;
        max-width: 280px;
    }
}
</style>
