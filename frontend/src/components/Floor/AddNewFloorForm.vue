<script setup lang="ts">
import { ref } from "vue";
import { noEmptyString } from "src/helpers/form-rules";

const emit = defineEmits(["create"]);
const floorName = ref("");

function onSubmit() {
    emit("create", floorName.value);
}

function onReset() {
    floorName.value = "";
}
</script>

<template>
    <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
        <q-input
            v-model="floorName"
            standout
            rounded
            label="Floor name *"
            lazy-rules
            :rules="[noEmptyString()]"
        />

        <div>
            <q-btn rounded size="md" label="Submit" type="submit" class="button-gradient" />
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
