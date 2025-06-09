import type { EventFloorDoc, FloorDoc } from "@firetable/types";
import type { AdminEventFloorManagerProps } from "src/components/admin/event/AdminEventFloorManager.vue";

import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { renderComponent } from "../../../../test-helpers/render-component";
import AdminEventFloorManager from "./AdminEventFloorManager.vue";

describe("AdminEventFloorManager", () => {
    let props: AdminEventFloorManagerProps;

    beforeEach(() => {
        props = {
            animationDuration: 0,
            floors: [
                { id: "floor1", name: "Floor 1", order: 0 },
                { id: "floor2", name: "Floor 2", order: 1 },
                { id: "floor3", name: "Floor 3", order: 2 },
            ] as EventFloorDoc[],
            maxFloors: 3,
        };
    });

    describe("drag and drop functionality", () => {
        it("emits reorder event when dragging floor to a new position", async () => {
            const screen = renderComponent(AdminEventFloorManager, props);

            const sourceFloor = screen.getByLabelText(
                "floor1 draggable floor plan item drag handle",
            );
            const targetFloor = screen.getByLabelText(
                "floor3 draggable floor plan item drag handle",
            );

            await userEvent.dragAndDrop(sourceFloor, targetFloor);
            await nextTick();

            const emitted = screen.emitted().reorder as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual([
                expect.objectContaining({ id: "floor3", order: 0 }),
                expect.objectContaining({ id: "floor1", order: 1 }),
                expect.objectContaining({ id: "floor2", order: 2 }),
            ]);
        });

        it("maintains floor data integrity after multiple reorders", async () => {
            const screen = renderComponent(AdminEventFloorManager, props);

            // First reorder: Move Floor 1 to end
            const floor1 = screen.getByLabelText("floor1 draggable floor plan item drag handle");
            const floor3 = screen.getByLabelText("floor3 draggable floor plan item drag handle");
            await userEvent.dragAndDrop(floor3, floor1);

            await nextTick();

            // Get fresh references after first reorder
            const floor2AfterFirstMove = screen.getByLabelText(
                "floor2 draggable floor plan item drag handle",
            );
            const floor1AfterFirstMove = screen.getByLabelText(
                "floor1 draggable floor plan item drag handle",
            );

            // Second reorder: Move Floor 2 to end
            await userEvent.dragAndDrop(floor2AfterFirstMove, floor1AfterFirstMove);

            await nextTick();

            const emitted = screen.emitted().reorder as any[];
            expect(emitted).toBeTruthy();
            expect(emitted).toHaveLength(2);

            const finalOrder = emitted[1][0];
            expect(finalOrder).toEqual([
                expect.objectContaining({ id: "floor3", order: 0 }),
                expect.objectContaining({ id: "floor1", order: 1 }),
                expect.objectContaining({ id: "floor2", order: 2 }),
            ]);
        });

        it("does not emit reorder event when dropping on the same position", async () => {
            const screen = renderComponent(AdminEventFloorManager, props);

            const sourceFloor = screen.getByLabelText("floor1 draggable floor plan item");

            await userEvent.dragAndDrop(sourceFloor, sourceFloor);

            const emitted = screen.emitted().reorder;
            expect(emitted).toBeFalsy();
        });
    });

    describe("floor limit functionality", () => {
        beforeEach(() => {
            props = {
                availableFloors: [
                    { id: "floor3", name: "Floor 3" },
                    { id: "floor4", name: "Floor 4" },
                ] as FloorDoc[],
                floors: [
                    { id: "floor1", name: "Floor 1", order: 0 },
                    { id: "floor2", name: "Floor 2", order: 1 },
                ] as EventFloorDoc[],
                maxFloors: 3,
            };
        });

        it("allows adding floor when under the limit", async () => {
            const screen = renderComponent(AdminEventFloorManager, props);

            const addButton = screen.getByLabelText("Add floor plan", { exact: true });
            await userEvent.click(addButton);

            await nextTick();

            const newFloorOption = screen
                .getByLabelText("Floor plans list", { exact: true })
                .getByText("Floor 3", { exact: true });
            await userEvent.click(newFloorOption);

            const emitted = screen.emitted().add as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toEqual(
                expect.objectContaining({
                    id: "floor3",
                    order: 2,
                }),
            );
        });

        it("displays the floor count when maxFloors is set", async () => {
            const screen = renderComponent(AdminEventFloorManager, props);
            await expect.element(screen.getByText("2/3 floors used")).toBeInTheDocument();
        });

        it("disables add button when floor limit is reached", async () => {
            // Already have 2 floors
            props.maxFloors = 2;
            const screen = renderComponent(AdminEventFloorManager, props);

            const addButton = screen.getByLabelText("Add floor plan").getByRole("button");
            await expect.element(addButton).toBeDisabled();
        });

        it("shows tooltip when floor limit is reached", async () => {
            // Already have 2 floors
            props.maxFloors = 2;
            const screen = renderComponent(AdminEventFloorManager, props);

            const addButton = screen.getByLabelText("Add floor plan");
            await userEvent.hover(addButton);

            await expect
                .element(screen.getByText("Maximum number of floors (2) reached"))
                .toBeVisible();
        });
    });
});
