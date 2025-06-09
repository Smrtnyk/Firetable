<template>
    <v-card-text>
        <p class="text-body-1 mb-4">{{ message }}</p>
    </v-card-text>
    <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="onCancel">
            {{ cancelText }}
        </v-btn>
        <v-btn color="primary" variant="text" @click="onConfirm">
            {{ confirmText }}
        </v-btn>
    </v-card-actions>
</template>

<script setup lang="ts">
interface ConfirmProps {
    cancelText?: string;
    confirmText?: string;
    message: string;
    onResult: (result: boolean) => void;
}

const props = defineProps<ConfirmProps>();

type Emits = (e: "close") => void;

const emit = defineEmits<Emits>();

function onCancel(): void {
    props.onResult(false);
    emit("close");
}

function onConfirm(): void {
    props.onResult(true);
    emit("close");
}
</script>
