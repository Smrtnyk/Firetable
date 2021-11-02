<script setup lang="ts">
import { ref } from "vue";
import { noEmptyString } from "src/helpers/form-rules";

import { useFloorsStore } from "src/stores/floors-store";

const FLOOR = {
    name: "",
};

const emit = defineEmits(["create"]);

const form = ref({ ...FLOOR });
const floorsStore = useFloorsStore();

function onSubmit() {
    emit("create", form.value);
}

function onReset() {
    form.value = { ...FLOOR };
}
</script>

<template>
    <q-dialog
        :model-value="floorsStore.showCreateFloorModal"
        @update:model-value="floorsStore.toggleCreateFloorModalVisibility"
        class="no-padding"
    >
        <div class="limited-width">
            <q-card>
                <q-banner inline-actions rounded class="bg-gradient text-white">
                    <template #avatar>
                        <q-btn
                            round
                            class="q-mr-sm"
                            flat
                            icon="close"
                            @click="floorsStore.toggleCreateFloorModalVisibility"
                        />
                    </template>
                    Add New Floor
                </q-banner>
                <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
                    <q-input
                        v-model="form.name"
                        standout
                        rounded
                        label="Floor name *"
                        lazy-rules
                        :rules="[noEmptyString()]"
                    />

                    <div>
                        <q-btn
                            rounded
                            size="md"
                            label="Submit"
                            type="submit"
                            class="button-gradient"
                        />
                        <q-btn
                            rounded
                            size="md"
                            outline
                            label="Reset"
                            type="reset"
                            color="primary"
                            class="q-ml-sm"
                        />
                    </div>
                </q-form>
            </q-card>
        </div>
    </q-dialog>
</template>
