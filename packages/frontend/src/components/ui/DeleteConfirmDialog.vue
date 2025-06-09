<template>
    <v-card-text>
        <p class="text-body-1 mb-4">{{ message }}</p>

        <v-text-field
            v-model="inputValue"
            :placeholder="t('helpers.ui.deleteConfirmPlaceholder', { confirmText })"
            variant="outlined"
            :error="hasError"
            :error-messages="hasError ? t('helpers.ui.deleteConfirmError', { confirmText }) : ''"
            @keyup.enter="onConfirm"
        />
    </v-card-text>

    <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="outlined" color="error" @click="onCancel">
            {{ t("Global.cancel") }}
        </v-btn>
        <v-btn color="primary" variant="flat" :disabled="!isValid" @click="onConfirm">
            {{ t("Global.confirm") }}
        </v-btn>
    </v-card-actions>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

interface DeleteConfirmProps {
    confirmText: string;
    message: string;
    onResult: (result: boolean) => void;
}

const props = defineProps<DeleteConfirmProps>();

type Emits = (e: "close") => void;

const emit = defineEmits<Emits>();

const { t } = useI18n();

const inputValue = ref("");
const hasError = ref(false);

const isValid = computed(() => inputValue.value === props.confirmText);

function onCancel(): void {
    props.onResult(false);
    emit("close");
}

function onConfirm(): void {
    if (isValid.value) {
        props.onResult(true);
        emit("close");
    } else {
        hasError.value = true;
        setTimeout(() => {
            hasError.value = false;
        }, 3000);
    }
}
</script>
