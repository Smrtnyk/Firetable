import type { FloorDropEvent, FloorEditor } from "@firetable/floor-creator";
import type { Ref, ShallowRef } from "vue";
import { onBeforeUnmount } from "vue";
import { FloorElementTypes, extractAllTablesLabels } from "@firetable/floor-creator";
import { isNumber } from "@firetable/utils";
import { showErrorMessage } from "src/helpers/ui-helpers";
import { debounce } from "quasar";

export const TABLE_EL_TO_ADD = [FloorElementTypes.RECT_TABLE, FloorElementTypes.ROUND_TABLE];

export function useFloorEditor(
    floorInstance: ShallowRef<FloorEditor | undefined>,
    containerRef: Ref<HTMLElement | undefined>,
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
        return String(++label);
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

    const resizeFloor = debounce((): void => {
        if (!containerRef.value) {
            return;
        }
        floorInstance.value?.resize(containerRef.value.clientWidth);
    }, 100);

    onBeforeUnmount(() => {
        floorInstance.value?.destroy();
    });

    return { getNextTableLabel, onFloorDrop, resizeFloor };
}
