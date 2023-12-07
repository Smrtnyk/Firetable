<template>
    <q-layout v-if="props.floor">
        <q-page-container>
            <q-page class="q-pa-xs-xs q-pa-sm-sm q-pa-md-md row">
                <div
                    ref="viewerContainerRef"
                    class="col-xs-12 col-md-8 offset-md-2 col-lg-6 offset-lg-3"
                >
                    <q-btn
                        class="button-gradient q-mb-sm"
                        @click="saveFloorState"
                        label="save"
                        size="md"
                        rounded
                    />
                    <FloorEditorControls
                        v-if="floorInstance"
                        :selected-floor-element="selectedFloorElement"
                        :delete-allowed="false"
                        :existing-labels="
                            new Set(extractAllTablesLabels(floorInstance as FloorEditor))
                        "
                        class="q-mb-sm"
                    />
                    <q-card>
                        <canvas id="floor-container" ref="floorContainerRef" />
                    </q-card>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import type { Floor, FloorEditorElement } from "@firetable/floor-creator";
import type { FloorDoc } from "@firetable/types";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import FloorEditorControls from "src/components/Floor/FloorEditorControls.vue";
import { extractAllTablesLabels, FloorEditor } from "@firetable/floor-creator";
import { debounce } from "quasar";

interface Props {
    floor: FloorDoc;
    eventId: string;
}

const selectedFloorElement = ref<FloorEditorElement | undefined>();
const props = defineProps<Props>();
const emit = defineEmits(["update"]);
const floorContainerRef = ref<HTMLCanvasElement | undefined>();
const viewerContainerRef = ref<HTMLDivElement | undefined>();
const floorInstance = ref<FloorEditor | undefined>();

onMounted(() => {
    window.addEventListener("resize", resizeFloor);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", resizeFloor);
    floorInstance.value?.destroy();
});

const resizeFloor = debounce((): void => {
    if (!viewerContainerRef.value) {
        return;
    }
    floorInstance.value?.resize(viewerContainerRef.value.clientWidth);
}, 100);

function saveFloorState(): void {
    if (!floorInstance.value) return;
    emit("update", floorInstance.value);
}

async function onElementClick(
    _floor: Floor,
    element: FloorEditorElement | undefined,
): Promise<void> {
    selectedFloorElement.value = undefined;
    await nextTick();
    selectedFloorElement.value = element;
}

watch(floorContainerRef, () => {
    if (!floorContainerRef.value || !viewerContainerRef.value) return;
    floorInstance.value = new FloorEditor({
        floorDoc: props.floor,
        canvas: floorContainerRef.value,
        containerWidth: viewerContainerRef.value.clientWidth,
    });
    floorInstance.value.on("elementClicked", onElementClick);
});
</script>
