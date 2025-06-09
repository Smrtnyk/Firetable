<template>
    <div v-if="error" class="error-boundary">
        <FTCard class="error-card ma-4" elevation="6">
            <div class="error-icon-container">
                <v-icon
                    size="x-large"
                    icon="fas fa-exclamation-circle"
                    color="error"
                    class="error-icon"
                ></v-icon>
            </div>

            <v-card-title class="error-title">Application Error</v-card-title>

            <v-card-text>
                <v-alert
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    :title="getErrorTypeTitle(error)"
                    border="start"
                >
                    {{ friendlyErrorMessage }}
                </v-alert>

                <v-expand-transition>
                    <div v-if="showDetails" class="error-details">
                        <v-sheet class="error-info mb-4 pa-3" rounded variant="outlined">
                            <p><strong>Error:</strong> {{ error.message }}</p>
                            <p v-if="info"><strong>Info:</strong> {{ info }}</p>
                        </v-sheet>

                        <v-sheet
                            v-if="error.stack"
                            class="error-stack mb-4"
                            rounded
                            variant="outlined"
                        >
                            <div class="d-flex align-center px-3 py-2 stack-header">
                                <span class="font-weight-medium">Stack Trace</span>
                                <v-spacer></v-spacer>
                                <v-btn
                                    density="compact"
                                    variant="text"
                                    icon="fas fa-copy"
                                    size="small"
                                    @click="copyToClipboard(error.stack as string)"
                                ></v-btn>
                            </div>
                            <v-divider></v-divider>
                            <pre class="pa-3">{{ error.stack }}</pre>
                        </v-sheet>
                    </div>
                </v-expand-transition>
            </v-card-text>

            <v-card-actions class="error-actions">
                <v-btn color="primary" @click="refreshPage" prepend-icon="fas fa-sync">
                    Refresh Application
                </v-btn>

                <v-btn
                    color="info"
                    variant="tonal"
                    @click="toggleDetails"
                    prepend-icon="fas fa-code"
                >
                    {{ showDetails ? "Hide" : "Show" }} Developer Details
                </v-btn>
            </v-card-actions>
        </FTCard>
    </div>
    <slot v-else></slot>
</template>

<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import { computed, onErrorCaptured, ref } from "vue";

import { AppLogger } from "../logger/FTLogger";
import FTCard from "./FTCard.vue";

type ErrorBoundaryProps = {
    logErrors?: boolean;
    showDetailsDefault?: boolean;
};

const { logErrors = true, showDetailsDefault = false } = defineProps<ErrorBoundaryProps>();

const IS_DEVELOPMENT = computed(() => {
    return import.meta.env.MODE === "development";
});

const error = ref<Error | null>(null);
const info = ref<string>("");
const showDetails = useLocalStorage(
    "error-boundary-show-details",
    showDetailsDefault || IS_DEVELOPMENT.value,
);

const ERROR_TYPES = {
    CHUNK_LOADING: "CHUNK_LOADING",
    GENERIC: "GENERIC",
    NETWORK: "NETWORK",
    REFERENCE: "REFERENCE",
    SYNTAX: "SYNTAX",
    TYPE: "TYPE",
} as const;

type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

function determineErrorType(err: Error): ErrorType {
    const message = err.message || "";

    if (
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Loading chunk") ||
        message.includes("ChunkLoadError") ||
        message.includes("Loading CSS chunk")
    ) {
        return ERROR_TYPES.CHUNK_LOADING;
    }

    if (message.includes("NetworkError") || message.includes("Failed to fetch")) {
        return ERROR_TYPES.NETWORK;
    }

    if (err instanceof SyntaxError) {
        return ERROR_TYPES.SYNTAX;
    }

    if (err instanceof TypeError) {
        return ERROR_TYPES.TYPE;
    }

    if (err instanceof ReferenceError) {
        return ERROR_TYPES.REFERENCE;
    }

    return ERROR_TYPES.GENERIC;
}

function getErrorTypeTitle(err: Error): string {
    const errorType = determineErrorType(err);

    switch (errorType) {
        case ERROR_TYPES.CHUNK_LOADING:
            return "Application Update Required";
        case ERROR_TYPES.NETWORK:
            return "Network Error";
        case ERROR_TYPES.REFERENCE:
            return "Reference Error";
        case ERROR_TYPES.SYNTAX:
            return "Syntax Error";
        case ERROR_TYPES.TYPE:
            return "Type Error";
        default:
            return "Unexpected Error";
    }
}

const friendlyErrorMessage = computed(() => {
    if (!error.value) return "";

    const errorType = determineErrorType(error.value);

    switch (errorType) {
        case ERROR_TYPES.CHUNK_LOADING:
            return "A new version of the application is available. Please refresh to update.";
        case ERROR_TYPES.NETWORK:
            return "Unable to connect to the server. Please check your internet connection and try again.";
        case ERROR_TYPES.REFERENCE:
            return "The application encountered a reference error. Please try refreshing the page.";
        case ERROR_TYPES.SYNTAX:
            return "The application encountered a syntax error. Please contact support.";
        case ERROR_TYPES.TYPE:
            return "The application encountered a type error. Please try refreshing the page.";
        default:
            return "Something went wrong. Please try refreshing the page.";
    }
});

function copyToClipboard(text: string): void {
    navigator.clipboard
        .writeText(text)
        .catch((e) => AppLogger.error("Failed to copy to clipboard:", e));
}

function refreshPage(): void {
    globalThis.location.reload();
}

function toggleDetails(): void {
    showDetails.value = !showDetails.value;
}

onErrorCaptured(function (err, instance, infoVal) {
    if (logErrors) {
        AppLogger.error(err);
    }

    error.value = err as Error;
    info.value = infoVal;

    if (determineErrorType(err as Error) === ERROR_TYPES.CHUNK_LOADING) {
        AppLogger.error(err);
    }

    return false;
});
</script>

<style scoped>
.error-boundary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
    background-color: rgba(0, 0, 0, 0.03);
}

.error-card {
    max-width: 600px;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
}

.error-icon-container {
    display: flex;
    justify-content: center;
    margin-top: 32px;
}

.error-icon {
    font-size: 72px;
}

.error-title {
    text-align: center;
    font-weight: bold;
    margin-top: 16px;
    font-size: 1.5rem;
}

.error-actions {
    justify-content: center;
    padding: 16px;
    gap: 12px;
    flex-wrap: wrap;
}

.error-stack {
    overflow-y: auto;
    max-height: 300px;
    border-radius: 8px;
    background-color: rgb(40, 44, 52);
}

.error-stack pre {
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: monospace;
    font-size: 12px;
    color: rgb(171, 178, 191);
}

.stack-header {
    background-color: rgba(0, 0, 0, 0.03);
}

.error-info {
    font-size: 14px;
}
</style>
