import type { Floor, FloorDropEvent, FloorEditorElement } from "@firetable/floor-creator";
import type { ShallowRef } from "vue";
import type { FloorDoc } from "@firetable/types";
import { FloorEditor, FloorElementTypes, extractAllTablesLabels } from "@firetable/floor-creator";
import { onBeforeUnmount, ref, shallowRef, nextTick } from "vue";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { debounce } from "quasar";
import { AppLogger } from "src/logger/FTLogger.js";
import { isNumber } from "es-toolkit/compat";

export const TABLE_EL_TO_ADD = [FloorElementTypes.RECT_TABLE, FloorElementTypes.ROUND_TABLE];

export function useFloorEditor(containerRef: ShallowRef<HTMLElement | null>) {
    const floorInstance = shallowRef<FloorEditor | undefined>();
    const selectedElement = ref<FloorEditorElement | undefined>();

    function onDeleteElement(element: FloorEditorElement): void {
        const elementToDelete = element.canvas?.getActiveObject();
        if (!elementToDelete) {
            return;
        }
        element.canvas?.remove(elementToDelete);
        selectedElement.value = undefined;
    }

    function getNextTableLabel(): string {
        if (!floorInstance.value) {
            showErrorMessage("Floor instance is not defined");
            return "";
        }
        let label: number;
        const labels = extractAllTablesLabels(floorInstance.value);
        const numericLabels = labels
            .map(function (val) {
                return Number.parseInt(val);
            })
            .filter(function (val) {
                return !Number.isNaN(val);
            });
        if (numericLabels.length === 0) {
            label = 0;
        } else {
            const maxLabel = Math.max(...numericLabels);
            label = isNumber(maxLabel) ? maxLabel : 0;
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
            const label = getNextTableLabel();
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
    }

    onBeforeUnmount(function () {
        floorInstance.value?.destroy().catch(AppLogger.error.bind(AppLogger));
    });

    return {
        floorInstance,
        selectedElement,
        resizeFloor,
        onDeleteElement,
        onElementClick,
        onFloorChange,
        initializeFloor,
    };
}
