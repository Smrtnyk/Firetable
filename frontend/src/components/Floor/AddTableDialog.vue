<script setup lang="ts">
import { ref } from "vue";
import { QForm } from "quasar";
import { noEmptyString } from "src/helpers/form-rules";

interface Props {
    ids: string[];
    id?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["create"]);
const addTableForm = ref<QForm | null>(null);
const tableId = ref<string>(String(props.ids.length + 1) || "");
const tableIdRules = [
    noEmptyString(),
    (val: string) => !props.ids.includes(val) || props.id === tableId.value || "Id is taken",
];

async function onOKClick() {
    if (!(await addTableForm.value?.validate())) return;
    emit("create", tableId.value);
}
</script>

<template>
    <q-card-section>
        <q-form ref="addTableForm" class="q-gutter-md">
            <q-input v-model="tableId" rounded standout autofocus :rules="tableIdRules" />
        </q-form>
    </q-card-section>

    <q-card-actions align="right">
        <q-btn
            rounded
            class="button-gradient"
            size="md"
            label="Add Table"
            @click="onOKClick"
            v-close-popup
        />
    </q-card-actions>
</template>
