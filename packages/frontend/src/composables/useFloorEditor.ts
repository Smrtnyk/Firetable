import type { Floor, FloorDropEvent, FloorEditorElement } from "@firetable/floor-creator";
import type { ShallowRef } from "vue";
import type { FloorDoc } from "@firetable/types";
import { FloorEditor, FloorElementTypes, extractAllTablesLabels } from "@firetable/floor-creator";
import { onBeforeUnmount, ref, shallowRef, nextTick } from "vue";
import { debounce } from "quasar";
import { AppLogger } from "src/logger/FTLogger.js";
import { toNumber, isNaN, toInteger } from "es-toolkit/compat";
import { negate } from "es-toolkit";

export const TABLE_EL_TO_ADD = [FloorElementTypes.RECT_TABLE, FloorElementTypes.ROUND_TABLE];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- pretty verbose
export function useFloorEditor(containerRef: ShallowRef<HTMLElement | null>) {
    const floorInstance = shallowRef<FloorEditor | undefined>();
    const selectedElement = ref<FloorEditorElement | undefined>();
    const hasChanges = ref(false);

    function onDeleteElement(element: FloorEditorElement): void {
        const elementToDelete = element.canvas?.getActiveObject();
        if (!elementToDelete) {
            return;
        }
        element.canvas?.remove(elementToDelete);
        selectedElement.value = undefined;
    }

    function getNextTableLabel(floorEditor: FloorEditor): string {
        let label = 0;
        const labels = extractAllTablesLabels(floorEditor);
        const numericLabels = labels.map(toNumber).filter(negate(isNaN));
        if (numericLabels.length > 0) {
            const maxLabel = Math.max(...numericLabels);
            label = toInteger(maxLabel);
        }
        label += 1;
        return String(label);
    }

    function onFloorDrop(floorEditor: FloorEditor, { data, x, y }: FloorDropEvent): void {
        if (!data) {
            return;
        }

        const { item, type } = JSON.parse(data);

        if (type !== "floor-element") {
            return;
        }

        if (TABLE_EL_TO_ADD.includes(item)) {
            const label = getNextTableLabel(floorEditor);
            floorEditor.addElement({ x, y, tag: item, label });
            return;
        }

        floorEditor.addElement({ x, y, tag: item });
    }

    const resizeFloor = debounce(function () {
        if (!containerRef.value) {
            return;
        }
        floorInstance.value?.resize(
            containerRef.value.clientWidth,
            containerRef.value.clientHeight,
        );
    }, 100);

    async function onElementClick(
        _: Floor,
        element: FloorEditorElement | undefined,
    ): Promise<void> {
        selectedElement.value = undefined;
        await nextTick();
        selectedElement.value = element;
    }

    function onFloorChange({
        name,
        width,
        height,
    }: {
        width?: number;
        height?: number;
        name?: string;
    }): void {
        if (name) {
            floorInstance.value?.setFloorName(String(name));
            return;
        }

        if (width && !Number.isNaN(width)) {
            floorInstance.value?.updateDimensions(width, floorInstance.value.height);
        }

        if (height && !Number.isNaN(height)) {
            floorInstance.value?.updateDimensions(floorInstance.value.width, Number(height));
        }
    }

    function initializeFloor({
        canvasElement,
        floorDoc,
    }: {
        canvasElement: HTMLCanvasElement;
        floorDoc: FloorDoc;
    }): void {
        if (!containerRef.value) {
            throw new Error("Container is not defined!");
        }
        const floorEditor = new FloorEditor({
            canvas: canvasElement,
            floorDoc,
            containerWidth: containerRef.value.clientWidth,
            containerHeight: containerRef.value.clientHeight,
        });

        floorInstance.value = floorEditor;
        floorEditor.on("elementClicked", onElementClick);
        floorEditor.on("drop", onFloorDrop);
        floorEditor.on("historyChange", function () {
            hasChanges.value = floorEditor.isDirty();
        });
    }

    onBeforeUnmount(function () {
        floorInstance.value?.destroy().catch(AppLogger.error.bind(AppLogger));
    });

    return {
        hasChanges,
        floorInstance,
        selectedElement,
        resizeFloor,
        onDeleteElement,
        onElementClick,
        onFloorChange,
        initializeFloor,
    };
}
