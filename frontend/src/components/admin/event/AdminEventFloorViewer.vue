<script setup lang="ts">
import { Floor } from "src/floor-manager/Floor";
import { BaseFloorElement, FloorDoc, FloorMode } from "src/types/floor";
import { ref, onMounted, watch } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { EventShowReservation } from "components/Event/EventShowReservation";
import { isTable } from "src/floor-manager/type-guards";

interface Props {
    floor: FloorDoc;
    mode: FloorMode;
}

const quasar = useQuasar();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const props = defineProps<Props>();
// eslint-disable-next-line vue/valid-define-emits
const emits = defineEmits([...useDialogPluginComponent.emits]);
const floorContainerRef = ref<HTMLDivElement | null>(null);

function elementClickHandler(floor: Floor | null, element: BaseFloorElement | null): void {
    if (element && isTable(element)) {
        quasar.dialog({
            component: EventShowReservation,
            componentProps: {
                reservation: element.reservation,
                floor,
                tableId: element.tableId,
                eventId: "dasd",
            },
        });
    }
}
watch(floorContainerRef, () => {
    if (!floorContainerRef.value) return;
    new Floor.Builder()
        .setFloorDocument(props.floor)
        .setMode(props.mode)
        .setContainer(floorContainerRef.value)
        .setElementClickHander(elementClickHandler)
        .build();
});
</script>

<template>
    <q-dialog ref="dialogRef" maximized>
        <div id="floor-container" class="eventFloor" ref="floorContainerRef" />
    </q-dialog>
</template>
