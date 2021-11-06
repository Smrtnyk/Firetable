<script setup lang="ts">
import { ref } from "vue";
import { useEventsStore } from "src/stores/events-store";
import { minLength } from "src/helpers/form-rules";

const emit = defineEmits(["create"]);
const guestName = ref("");
const eventsStore = useEventsStore();

function onSubmit() {
    emit("create", {
        confirmed: false,
        confirmedTime: null,
        name: guestName.value,
    });
    onReset();
}

function onReset() {
    guestName.value = "";
}
</script>

<template>
    <q-dialog
        :model-value="eventsStore.showAddNewGuestForm"
        @update:model-value="eventsStore.toggleShowAddNewGuestFormVisibility"
    >
        <div class="limited-width EventGuestListCreateGuestForm">
            <q-card>
                <q-banner inline-actions rounded class="bg-gradient text-white">
                    <template #avatar>
                        <q-btn round class="q-mr-sm" flat icon="close" v-close-popup />
                    </template>
                    Add Guest
                </q-banner>
                <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
                    <q-input
                        v-model="guestName"
                        standout
                        rounded
                        label="Guest name *"
                        hint="Name of the guest"
                        lazy-rules
                        :rules="[minLength('Name must have at least 3 characters!', 3)]"
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
