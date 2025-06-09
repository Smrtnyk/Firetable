<template>
    <div class="build-info text-center text-caption text-disabled mt-6 py-2">
        Build: {{ buildNumber }} <span v-if="showGitHash">({{ gitCommitHash }})</span>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface BuildInfoFooterProps {
    showGitHash?: boolean;
}

const { showGitHash = false } = defineProps<BuildInfoFooterProps>();

const buildNumber = computed(function (): string {
    return __BUILD_NUMBER__;
});

const gitCommitHash = computed(function (): string {
    return __GIT_COMMIT_HASH__;
});
</script>

<style scoped>
.build-info {
    font-size: 10px;
    opacity: 0.7;
}
</style>
