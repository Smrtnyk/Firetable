import type { EventCreateFormProps } from "./EventCreateForm.vue";
import type { FloorDoc } from "@firetable/types";
import EventCreateForm from "./EventCreateForm.vue";
import { renderComponent } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { nextTick } from "vue";

const { showErrorMessageSpy } = vi.hoisted(() => {
    return { showErrorMessageSpy: vi.fn() };
});

vi.mock("src/helpers/ui-helpers", () => ({
    showErrorMessage: showErrorMessageSpy,
}));

describe("EventCreateForm", () => {
    describe("create", () => {
        let props: EventCreateFormProps;

        beforeEach(() => {
            props = {
                propertyId: "property1",
                organisationId: "org1",
                propertyName: "Test Property",
                floors: [
                    { id: "floor1", name: "Floor 1" } as FloorDoc,
                    { id: "floor2", name: "Floor 2" } as FloorDoc,
                ],
                eventStartHours: "22:00",
            };
        });

        it("renders the form with initial values", () => {
            const screen = renderComponent(EventCreateForm, props);

            // Check that the form fields are empty or have default values
            expect(
                screen.getByLabelText("Optional event image url").query()?.getAttribute("value"),
            ).toBe("");
            expect(screen.getByLabelText("Event name*").query()?.getAttribute("value")).toBe("");
            expect(screen.getByLabelText("Guest List Limit").query()?.getAttribute("value")).toBe(
                "100",
            );
            expect(screen.getByLabelText("Entry Price").query()?.getAttribute("value")).toBe("0");
            const floorCheckboxes = screen.getByRole("checkbox");

            expect(
                screen.getByLabelText("Event date and time").query()?.getAttribute("value"),
            ).toContain("22:00");

            for (const element of floorCheckboxes.elements()) {
                expect(element.getAttribute("aria-checked")).toBe("false");
            }
        });

        it("validates required fields", async () => {
            const screen = renderComponent(EventCreateForm, props);
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);

            expect(screen.getByText("Please type something").query()).toBeTruthy();
        });

        it("shows error when no floors are selected", async () => {
            const screen = renderComponent(EventCreateForm, props);

            // Fill out other required fields
            await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");

            const submitButton = screen.getByRole("button", { name: "Submit" });

            await userEvent.click(submitButton);

            expect(showErrorMessageSpy).toHaveBeenCalledWith(
                "You need to choose at least one floor plan",
            );
        });

        it("emits create event with correct payload", async () => {
            const screen = renderComponent(EventCreateForm, props);

            // Fill out the form fields
            await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");
            await userEvent.fill(
                screen.getByLabelText("Event Image URL"),
                "https://example.com/image.jpg",
            );

            const floorCheckboxes = screen.getByRole("checkbox");
            await userEvent.click(floorCheckboxes.elements()[0]);
            const submitButton = screen.getByRole("button", { name: "Submit" });
            await userEvent.click(submitButton);
            await nextTick();

            // Check that the 'create' event was emitted with correct payload
            const emitted = screen.emitted().create as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toMatchObject({
                name: "Test Event",
                guestListLimit: 100,
                entryPrice: 50,
                img: "https://example.com/image.jpg",
                propertyId: props.propertyId,
                organisationId: props.organisationId,
                floors: [{ id: "floor1", name: "Floor 1" }],
            });
        });

        it("resets the form when reset button is clicked", async () => {
            const screen = renderComponent(EventCreateForm, props);

            // Fill out the form fields
            await userEvent.fill(screen.getByLabelText("Event Name"), "Test Event");
            await userEvent.fill(screen.getByLabelText("Guest List Limit"), "100");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "50");
            await userEvent.fill(
                screen.getByLabelText("Event Image URL"),
                "https://example.com/image.jpg",
            );

            const floorCheckboxes = screen.getByRole("checkbox");
            const firstCheckbox = floorCheckboxes.elements()[0];
            await userEvent.click(firstCheckbox);

            const resetButton = screen.getByRole("button", { name: "Reset" });

            await userEvent.click(resetButton);

            // Check that the form fields are reset
            expect(screen.getByLabelText("Event Name").query()?.textContent).toBe("");
            expect(screen.getByLabelText("Guest List Limit").query()?.textContent).toBe("");
            expect(screen.getByLabelText("Entry Price").query()?.textContent).toBe("");
            expect(screen.getByLabelText("Event Image URL").query()?.textContent).toBe("");
            expect(firstCheckbox.getAttribute("aria-checked")).toBe("false");
        });
    });

    describe("edit", () => {
        let props: EventCreateFormProps;

        beforeEach(() => {
            props = {
                propertyId: "property1",
                organisationId: "org1",
                propertyName: "Test Property",
                floors: [
                    { id: "floor1", name: "Floor 1" } as FloorDoc,
                    { id: "floor2", name: "Floor 2" } as FloorDoc,
                ],
                eventStartHours: "22:00",
                event: {
                    id: "event1",
                    name: "Existing Event",
                    date: new Date("2023-12-31T22:00:00Z").getTime(),
                    guestListLimit: 150,
                    entryPrice: 75,
                    img: "https://example.com/old-image.jpg",
                    propertyId: "property1",
                    organisationId: "org1",
                    creator: "user1",
                    _doc: {} as any,
                },
            };
        });

        it("renders the form with event data", async () => {
            const screen = renderComponent(EventCreateForm, props);

            await nextTick();

            // Check that the form fields are populated with event data
            expect(
                screen.getByLabelText("Optional event image url").query()?.getAttribute("value"),
            ).toBe(props.event!.img);
            expect(screen.getByLabelText("Event Name").query()?.getAttribute("value")).toBe(
                props.event!.name,
            );
            expect(screen.getByLabelText("Guest List Limit").query()?.getAttribute("value")).toBe(
                String(props.event!.guestListLimit),
            );
            expect(screen.getByLabelText("Entry Price").query()?.getAttribute("value")).toBe(
                String(props.event!.entryPrice),
            );

            expect(
                screen.getByLabelText("Event date and time").query()?.getAttribute("value"),
            ).toContain("22:00");
        });

        it("does not display floor selection in edit mode", () => {
            const screen = renderComponent(EventCreateForm, props);

            // Ensure that floor checkboxes are not rendered
            const floorCheckboxes = screen.getByRole("checkbox");
            expect(floorCheckboxes.elements().length).toBe(0);
        });

        it("emits update event with correct payload", async () => {
            const screen = renderComponent(EventCreateForm, props);

            // Update some form fields
            await userEvent.fill(screen.getByLabelText("Event Name"), "Updated Event");
            await userEvent.fill(screen.getByLabelText("Entry Price"), "80");

            const submitButton = screen.getByRole("button", { name: "Submit" });

            await userEvent.click(submitButton);

            await nextTick();

            // Check that the 'update' event was emitted with correct payload
            const emitted = screen.emitted().update as any[];
            expect(emitted).toBeTruthy();
            expect(emitted[0][0]).toMatchObject({
                name: "Updated Event",
                // Should remain unchanged
                guestListLimit: props.event!.guestListLimit,
                entryPrice: 80,
                // Should remain unchanged unless updated
                img: props.event!.img,
                propertyId: props.propertyId,
                organisationId: props.organisationId,
            });
        });
    });
});
