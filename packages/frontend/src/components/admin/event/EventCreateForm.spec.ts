import type { FloorDoc } from "@firetable/types";

import { userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import type { EventCreateFormProps } from "./EventCreateForm.vue";

import { renderComponent } from "../../../../test-helpers/render-component";
import EventCreateForm from "./EventCreateForm.vue";

describe("EventCreateForm", () => {
    describe("create", () => {
        let props: EventCreateFormProps;

        beforeEach(() => {
            props = {
                eventStartHours: "22:00",
                floors: [
                    { id: "floor1", name: "Floor 1" } as FloorDoc,
                    { id: "floor2", name: "Floor 2" } as FloorDoc,
                ],
                maxFloors: 3,
                organisationId: "org1",
                propertyId: "property1",
                propertyName: "Test Property",
                propertyTimezone: "Europe/Vienna",
            };
        });

        afterEach(() => {
            document.body.innerHTML = "";
        });

        it("renders the form with initial values", async () => {
            const screen = renderComponent(EventCreateForm, props);

            // Check that the form fields are empty or have default values
            await expect.element(screen.getByLabelText("Optional event image url")).toHaveValue("");
            await expect.element(screen.getByLabelText("Event name*")).toHaveValue("");
            await expect.element(screen.getByLabelText("Guest List Limit")).toHaveValue(100);
            await expect.element(screen.getByLabelText("Entry Price")).toHaveValue(0);

            expect(
                screen.getByLabelText("Event date and time").query()?.getAttribute("value"),
            ).toContain("22:00");

            const addFloorBtn = screen.getByLabelText("Add floor plan");
            await expect.element(addFloorBtn).toBeVisible();
        });

        it("validates required fields", async () => {
            const screen = renderComponent(EventCreateForm, props);
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            await expect.element(screen.getByText("Please type something")).toBeVisible();
        });

        it("shows error when no floors are selected", async () => {
            const screen = renderComponent(EventCreateForm, props, {
                includeGlobalComponents: true,
                wrapInLayout: true,
            });

            await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            await expect
                .element(screen.getByText("You need to choose at least one floor plan"))
                .toBeVisible();

            await userEvent.click(screen.getByRole("button", { name: "OK" }));
        });

        it("allows adding multiple instances of the same floor", async () => {
            const screen = renderComponent(EventCreateForm, props);

            const addFloorBtn = screen.getByLabelText("Add floor plan");
            await userEvent.click(addFloorBtn);

            const floor1Option = screen.getByLabelText("Add Floor 1 floor plan");
            await userEvent.click(floor1Option);
            await userEvent.click(addFloorBtn);
            await userEvent.click(floor1Option);

            const floorItems = screen.getByLabelText("Selected floor plans").getByText("Floor 1");
            expect(floorItems.elements()).toHaveLength(2);
        });

        it("allows removing floors", async () => {
            const screen = renderComponent(EventCreateForm, props);

            const addFloorBtn = screen.getByLabelText("Add floor plan");
            await userEvent.click(addFloorBtn);
            await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));

            await expect
                .element(screen.getByLabelText("Selected floor plans").getByText("Floor 1"))
                .toBeVisible();

            const removeFloorBtn = screen.getByLabelText("Remove Floor 1 floor plan");
            await userEvent.click(removeFloorBtn);

            await expect
                .element(screen.getByLabelText("Selected floor plans").getByText("Floor 1"))
                .not.toBeInTheDocument();
        });

        it("emits create event with correct payload", async () => {
            const screen = renderComponent(EventCreateForm, props);

            await userEvent.fill(screen.getByLabelText("Event Name*"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");
            await userEvent.fill(
                screen.getByLabelText("Event Image URL"),
                "https://example.com/image.jpg",
            );

            const addFloorBtn = screen.getByLabelText("Add floor plan");
            await userEvent.click(addFloorBtn);
            await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));
            await userEvent.click(addFloorBtn);
            await userEvent.click(screen.getByLabelText("Add Floor 2 floor plan"));

            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);
            await nextTick();

            // Check that the 'create' event was emitted with correct payload
            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toMatchObject({
                entryPrice: 50,
                floors: [
                    { id: "floor1", name: "Floor 1" },
                    { id: "floor2", name: "Floor 2" },
                ],
                guestListLimit: 100,
                img: "https://example.com/image.jpg",
                name: "Test Event",
                organisationId: props.organisationId,
                propertyId: props.propertyId,
            });
        });

        it("resets the form when reset button is clicked", async () => {
            const screen = renderComponent(EventCreateForm, props);

            await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");
            await userEvent.fill(
                screen.getByLabelText("Event Image URL"),
                "https://example.com/image.jpg",
            );

            const addFloorBtn = screen.getByLabelText("Add floor plan");
            await userEvent.click(addFloorBtn);
            await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));

            const resetButton = screen.getByRole("button", { name: "Reset" });
            await userEvent.click(resetButton);

            await expect.element(screen.getByLabelText("Event Name*")).toHaveValue("");
            await expect.element(screen.getByLabelText("Guest List Limit")).toHaveValue(100);
            await expect.element(screen.getByLabelText("Entry Price")).toHaveValue(0);
            await expect.element(screen.getByLabelText("Event Image URL")).toHaveValue("");
            await expect
                .element(screen.getByLabelText("Selected floor plans").getByText("Floor 1"))
                .not.toBeInTheDocument();
        });

        describe("floor ordering", () => {
            beforeEach(() => {
                props = {
                    eventStartHours: "22:00",
                    floors: [
                        { id: "floor1", name: "Floor 1" } as FloorDoc,
                        { id: "floor2", name: "Floor 2" } as FloorDoc,
                        { id: "floor3", name: "Floor 3" } as FloorDoc,
                    ],
                    maxFloors: 3,
                    organisationId: "org1",
                    propertyId: "property1",
                    propertyName: "Test Property",
                    propertyTimezone: "Europe/Vienna",
                };
            });

            it("assigns correct order when adding floors", async () => {
                const screen = renderComponent(EventCreateForm, props);

                const addFloorBtn = screen.getByLabelText("Add floor plan");
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 2 floor plan"));
                await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
                const submitButton = screen.getByRole("button", { name: "Submit" });
                await userEvent.click(submitButton);

                const emitted = screen.emitted().create as any[];
                expect(emitted[0][0].floors).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ id: "floor1", order: 0 }),
                        expect.objectContaining({ id: "floor2", order: 1 }),
                    ]),
                );
            });

            it("reorders floors correctly when removing a floor", async () => {
                const screen = renderComponent(EventCreateForm, props);
                const addFloorBtn = screen.getByLabelText("Add floor plan");

                // Add three floors
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 2 floor plan"));
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 3 floor plan"));

                // Remove middle floor
                const removeFloor2Btn = screen.getByLabelText("Remove Floor 2 floor plan");
                await userEvent.click(removeFloor2Btn);

                // Submit and verify order was updated
                await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
                const submitButton = screen.getByRole("button", { name: "Submit" });
                await userEvent.click(submitButton);

                const emitted = screen.emitted().create as any[];
                expect(emitted[0][0].floors).toEqual([
                    expect.objectContaining({ id: "floor1", order: 0 }),
                    expect.objectContaining({ id: "floor3", order: 1 }),
                ]);
            });

            it("maintains order when resetting the form", async () => {
                const screen = renderComponent(EventCreateForm, props);
                const addFloorBtn = screen.getByLabelText("Add floor plan");

                // Add floors
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 2 floor plan"));

                // Reset form
                const resetButton = screen.getByRole("button", { name: "Reset" });
                await userEvent.click(resetButton);

                // Add floors again
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 1 floor plan"));
                await userEvent.click(addFloorBtn);
                await userEvent.click(screen.getByLabelText("Add Floor 2 floor plan"));

                // Submit and verify order
                await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
                const submitButton = screen.getByRole("button", { name: "Submit" });
                await userEvent.click(submitButton);

                const emitted = screen.emitted().create as any[];
                expect(emitted[0][0].floors).toEqual([
                    expect.objectContaining({ id: "floor1", order: 0 }),
                    expect.objectContaining({ id: "floor2", order: 1 }),
                ]);
            });
        });
    });

    describe("edit", () => {
        let props: EventCreateFormProps;

        beforeEach(() => {
            props = {
                event: {
                    _doc: {} as any,
                    creator: "user1",
                    date: new Date("2023-12-31T22:00:00Z").getTime(),
                    entryPrice: 75,
                    guestListLimit: 150,
                    id: "event1",
                    img: "https://example.com/old-image.jpg",
                    name: "Existing Event",
                    organisationId: "org1",
                    propertyId: "property1",
                },
                eventStartHours: "22:00",
                floors: [
                    { id: "floor1", name: "Floor 1" } as FloorDoc,
                    { id: "floor2", name: "Floor 2" } as FloorDoc,
                ],
                maxFloors: 3,
                organisationId: "org1",
                propertyId: "property1",
                propertyName: "Test Property",
                propertyTimezone: "Europe/London",
            };
        });

        it("renders the form with event data", async () => {
            const screen = renderComponent(EventCreateForm, props);
            await expect
                .element(screen.getByLabelText("Optional event image url"))
                .toHaveValue(props.event!.img);
            await expect
                .element(screen.getByLabelText("Event Name"))
                .toHaveValue(props.event!.name);
            await expect
                .element(screen.getByLabelText("Guest List Limit"))
                .toHaveValue(props.event!.guestListLimit);
            await expect
                .element(screen.getByLabelText("Entry Price"))
                .toHaveValue(props.event!.entryPrice);

            expect(
                screen.getByLabelText("Event date and time").query()?.getAttribute("value"),
            ).toContain("22:00");
        });

        it("does not display floor selection in edit mode", async () => {
            const screen = renderComponent(EventCreateForm, props);

            await expect.element(screen.getByLabelText("Add floor plan")).not.toBeInTheDocument();
            const floorCheckboxes = screen.getByRole("checkbox");
            await expect.element(floorCheckboxes.first()).not.toBeInTheDocument();
        });

        it("emits update event with correct payload", async () => {
            const screen = renderComponent(EventCreateForm, props);

            await userEvent.fill(screen.getByLabelText("Event Name"), "Updated Event");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "80");

            const submitButton = screen.getByRole("button", { name: "Submit" });

            await userEvent.click(submitButton);

            const emitted = screen.emitted().update as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toMatchObject({
                entryPrice: 80,
                // Should remain unchanged
                guestListLimit: props.event!.guestListLimit,
                // Should remain unchanged unless updated
                img: props.event!.img,
                name: "Updated Event",
                organisationId: props.organisationId,
                propertyId: props.propertyId,
            });
        });

        it("allows selecting past dates in edit mode", async () => {
            const screen = renderComponent(EventCreateForm, props);

            const calendarIcon = screen.getByLabelText("Open date calendar");
            await userEvent.click(calendarIcon);

            // yesterday's date
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayDay = yesterday.getDate().toString();

            // find the date cell for yesterday
            const dateCell = screen.getByRole("button", { exact: true, name: yesterdayDay });
            await userEvent.click(dateCell);

            const dateValue = screen.getByLabelText("Event date and time");
            await expect.element(dateValue).toHaveValue(expect.stringContaining(yesterdayDay));
        });
    });
});
