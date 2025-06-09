<template>
    <v-card-text>
        <div class="d-flex align-center mb-4">
            <v-icon color="error" size="large" class="me-3"> fas fa-exclamation-triangle </v-icon>
            <div>
                <p class="text-body-1 mb-0">{{ displayMessage }}</p>
            </div>
        </div>
    </v-card-text>

    <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="onClose">
            {{ t("Global.ok") }}
        </v-btn>
    </v-card-actions>
</template>

<script setup lang="ts">
import { isString } from "es-toolkit";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface ErrorProps {
    message?: Error | string | unknown;
}

const props = defineProps<ErrorProps>();

type Emits = (e: "close") => void;

const emit = defineEmits<Emits>();

const { t } = useI18n();

const displayMessage = computed(() => {
    if (!props.message) {
        return t("helpers.ui.unexpectedError");
    }

    if (isString(props.message)) {
        return props.message;
    }

    if (props.message instanceof Error) {
        return props.message.message;
    }

    return t("helpers.ui.unexpectedError");
});

function onClose(): void {
    emit("close");
}
</script>
