import type { EventFloorDoc, FloorDoc } from "@firetable/types";
import AdminEventFloorManager from "./AdminEventFloorManager.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";

vi.mock("src/global-reactives/screen-detection");

describe("AdminEventFloorManager", function () {
    interface Props {
        floors: EventFloorDoc[];
        availableFloors?: FloorDoc[];
        isEditMode?: boolean;
        showEditButton?: boolean;
    }

    let props: Props;

    beforeEach(function () {
        props = {
            floors: [
                { id: "floor1", name: "Floor 1", order: 0 },
                { id: "floor2", name: "Floor 2", order: 1 },
                { id: "floor3", name: "Floor 3", order: 2 },
            ] as EventFloorDoc[],
            isEditMode: true,
        };
    });

    describe("drag and drop functionality", function () {
        it("emits reorder event when dragging floor to a new position", async function () {
            const screen = renderComponent(AdminEventFloorManager, props);

            const sourceFloor = screen.getByLabelText("floor1 draggable floor plan item");
            const targetFloor = screen.getByLabelText("floor3 draggable floor plan item");

            await userEvent.dragAndDrop(sourceFloor, targetFloor);
            await nextTick();

            const emitted = screen.emitted().reorder as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual([
                expect.objectContaining({ id: "floor2", order: 0 }),
                expect.objectContaining({ id: "floor3", order: 1 }),
                expect.objectContaining({ id: "floor1", order: 2 }),
            ]);
        });

        it("allows drag and drop in non-edit mode", async function () {
            props.isEditMode = false;
            const screen = renderComponent(AdminEventFloorManager, props);

            const sourceFloor = screen.getByLabelText("floor1 draggable floor plan item");
            const targetFloor = screen.getByLabelText("floor3 draggable floor plan item");

            await userEvent.dragAndDrop(sourceFloor, targetFloor);

            const emitted = screen.emitted().reorder as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual([
                expect.objectContaining({ id: "floor2", order: 0 }),
                expect.objectContaining({ id: "floor3", order: 1 }),
                expect.objectContaining({ id: "floor1", order: 2 }),
            ]);
        });

        it("maintains floor data integrity after multiple reorders", async function () {
            const screen = renderComponent(AdminEventFloorManager, props);

            // First reorder: Move Floor 1 to end
            const floor1 = screen.getByLabelText("floor1 draggable floor plan item");
            const floor3 = screen.getByLabelText("floor3 draggable floor plan item");
            await userEvent.dragAndDrop(floor1, floor3);

            // Get fresh references after first reorder
            const floor2AfterFirstMove = screen.getByLabelText("floor2 draggable floor plan item");
            const floor1AfterFirstMove = screen.getByLabelText("floor1 draggable floor plan item");

            // Second reorder: Move Floor 2 to end
            await userEvent.dragAndDrop(floor2AfterFirstMove, floor1AfterFirstMove);

            const emitted = screen.emitted().reorder as any[];
            expect(emitted).toBeTruthy();
            expect(emitted).toHaveLength(2);

            const finalOrder = emitted[1][0];
            expect(finalOrder).toEqual([
                expect.objectContaining({ id: "floor2", order: 0 }),
                expect.objectContaining({ id: "floor1", order: 1 }),
                expect.objectContaining({ id: "floor3", order: 2 }),
            ]);
        });

        it("does not emit reorder event when dropping on the same position", async function () {
            const screen = renderComponent(AdminEventFloorManager, props);

            const sourceFloor = screen.getByLabelText("floor1 draggable floor plan item");

            await userEvent.dragAndDrop(sourceFloor, sourceFloor);

            const emitted = screen.emitted().reorder;
            expect(emitted).toBeFalsy();
        });
    });
});
