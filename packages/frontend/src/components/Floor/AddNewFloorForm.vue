<script setup lang="ts">
import { ref } from "vue";
import { noEmptyString } from "src/helpers/form-rules";

interface Props {
    allFloorNames: Set<string>;
}

const props = defineProps<Props>();
const emit = defineEmits(["create"]);
const floorName = ref("");

function noSameFloorName(val: string): boolean | string {
    return !props.allFloorNames.has(val) || "Floor with the same name already exists!";
}

function onSubmit(): void {
    emit("create", floorName.value);
}

function onReset(): void {
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
            :rules="[noEmptyString(), noSameFloorName]"
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
