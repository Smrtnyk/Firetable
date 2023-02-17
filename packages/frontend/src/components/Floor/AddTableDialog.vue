<script setup lang="ts">
import { ref } from "vue";
import { QForm } from "quasar";
import { noEmptyString } from "src/helpers/form-rules";

interface Props {
    ids: Set<string>;
}

const props = defineProps<Props>();
const emit = defineEmits(["create"]);
const addTableForm = ref<QForm | null>(null);
const tableId = ref<string>("");
const tableIdRules = [noEmptyString(), validateTableNewId];

function validateTableNewId(val: string) {
    return !props.ids.has(val) || "Table with same ID already exists!";
}

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
        <q-btn rounded class="button-gradient" size="md" label="Add Table" @click="onOKClick" />
    </q-card-actions>
</template>
