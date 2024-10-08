import type { FloorDropEvent, FloorEditor } from "@firetable/floor-creator";
import type { ShallowRef } from "vue";
import { onBeforeUnmount } from "vue";
import { FloorElementTypes, extractAllTablesLabels } from "@firetable/floor-creator";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { debounce } from "quasar";
import { AppLogger } from "src/logger/FTLogger.js";

export function isNumber(candidate: unknown): candidate is number {
    return !Number.isNaN(candidate) && typeof candidate === "number" && Number.isFinite(candidate);
}

export const TABLE_EL_TO_ADD = [FloorElementTypes.RECT_TABLE, FloorElementTypes.ROUND_TABLE];

export function useFloorEditor(
    floorInstance: ShallowRef<FloorEditor | undefined>,
    containerRef: ShallowRef<HTMLElement | null>,
) {
    function getNextTableLabel(): string {
        if (!floorInstance.value) {
            showErrorMessage("Floor instance is not defined");
            return "";
        }
        let label: number;
        const labels = extractAllTablesLabels(floorInstance.value);
        const numericLabels = labels.map((val) => Number.parseInt(val)).filter(isNumber);
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
        floorInstance.value?.resize(containerRef.value.clientWidth);
    }, 100);

    onBeforeUnmount(function () {
        floorInstance.value?.destroy().catch(AppLogger.error.bind(AppLogger));
    });

    return { getNextTableLabel, onFloorDrop, resizeFloor };
}
