<script setup lang="ts">
import { ref } from "vue";
import { minLength } from "src/helpers/form-rules";

const emit = defineEmits(["create"]);
const guestName = ref("");

function onSubmit() {
    emit("create", {
        confirmed: false,
        confirmedTime: null,
        name: guestName.value,
    });
}

function onReset() {
    guestName.value = "";
}
</script>

<template>
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
                v-close-popup
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
</template>
