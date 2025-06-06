<script setup lang="ts">
import { noEmptyString } from "src/helpers/form-rules";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    allFloorNames: Set<string>;
}

const { t } = useI18n();
const props = defineProps<Props>();
const emit = defineEmits(["create"]);
const floorName = ref("");

function noSameFloorName(val: string): boolean | string {
    return !props.allFloorNames.has(val) || "Floor with the same name already exists!";
}

function onReset(): void {
    floorName.value = "";
}

function onSubmit(): void {
    emit("create", floorName.value);
}
</script>

<template>
    <q-form class="q-gutter-md q-pt-md q-pa-md" @submit="onSubmit" @reset="onReset">
        <q-input
            v-model="floorName"
            outlined
            label="Floor name *"
            lazy-rules
            :rules="[noEmptyString(), noSameFloorName]"
        />

        <div>
            <q-btn
                rounded
                size="md"
                :label="t('Global.submit')"
                type="submit"
                class="button-gradient"
            />
            <q-btn
                rounded
                size="md"
                outline
                :label="t('Global.reset')"
                type="reset"
                color="primary"
                class="q-ml-sm"
            />
        </div>
    </q-form>
</template>
