<script setup lang="ts">
import { ref } from "vue";
import { useDialogPluginComponent, QForm } from "quasar";
import { noEmptyString } from "src/helpers/form-rules";

interface Props {
    ids: string[];
    id: string;
}

const props = defineProps<Props>();
// eslint-disable-next-line vue/valid-define-emits
const emit = defineEmits(useDialogPluginComponent.emits);
const addTableForm = ref<QForm | null>(null);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const tableId = ref<string>(props.id || String(props.ids.length + 1) || "");
const tableIdRules = [
    noEmptyString(),
    (val: string) => !props.ids.includes(val) || props.id === tableId.value || "Id is taken",
];

async function onOKClick() {
    if (!(await addTableForm.value?.validate())) return;
    onDialogOK(tableId.value);
}
</script>

<template>
    <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
        <q-card class="q-dialog-plugin AddTableDialog">
            <q-card-section>
                <div class="text-h6">Table ID</div>
            </q-card-section>

            <q-card-section>
                <q-form ref="addTableForm" class="q-gutter-md">
                    <q-input v-model="tableId" rounded standout autofocus :rules="tableIdRules" />
                </q-form>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn rounded class="button-gradient" size="md" label="OK" @click="onOKClick" />
                <q-btn rounded color="negative" label="Cancel" @click="onDialogCancel" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>
