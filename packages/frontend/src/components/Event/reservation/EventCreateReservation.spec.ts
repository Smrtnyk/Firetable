import type {
    PlannedReservation,
    PlannedReservationDoc,
    User,
    WalkInReservation,
} from "@firetable/types";

import { ReservationState, ReservationStatus, ReservationType } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { addHours, format } from "date-fns";
import { ONE_HOUR } from "src/constants";
import { getDefaultTimezone, hourFromTimestamp } from "src/helpers/date-utils";
import { beforeEach, describe, expect, it } from "vitest";

import type { EventCreateReservationProps } from "./EventCreateReservation.vue";

import { getLocaleForTest, renderComponent, t } from "../../../../test-helpers/render-component";
import EventCreateReservation from "./EventCreateReservation.vue";

const eventStartTimestamp = Date.now();

describe("EventCreateReservation", () => {
    let props: EventCreateReservationProps;

    describe("WalkIn", () => {
        beforeEach(() => {
            props = {
                currentUser: {
                    email: "example@mail.com",
                    id: "user1",
                    name: "Alice",
                } as User,
                eventDurationInHours: 8,
                eventStartTimestamp,
                mode: "create",
                timezone: getDefaultTimezone(),
                users: [],
            };
        });

        // Helper function to generate initial state for "create" mode
        function generateInitialState(): Omit<WalkInReservation, "creator"> {
            const eventStart = props.eventStartTimestamp;
            const now = Date.now();
            const initialTime = Math.max(now, eventStart);
            const formattedTime = hourFromTimestamp(
                initialTime,
                getLocaleForTest().value,
                getDefaultTimezone(),
            );
            return {
                arrived: true,
                consumption: 0,
                floorId: "",
                guestContact: "",
                guestName: "",
                isVIP: false,
                numberOfGuests: 2,
                reservationNote: "",
                state: ReservationState.ARRIVED,
                status: ReservationStatus.ACTIVE,
                tableLabel: "",
                time: formattedTime,
                type: ReservationType.WALK_IN,
            };
        }

        // Helper function to generate initial state for "update" mode
        function generateUpdateState(): Omit<WalkInReservation, "creator"> {
            return {
                arrived: true,
                consumption: 50,
                floorId: "",
                guestContact: "+43666666666",
                guestName: "John Doe",
                isVIP: true,
                numberOfGuests: 4,
                reservationNote: "Birthday celebration",
                state: ReservationState.ARRIVED,
                status: ReservationStatus.ACTIVE,
                tableLabel: "",
                time: "19:00",
                type: ReservationType.WALK_IN,
            };
        }

        it("renders the form with initial values in 'create' mode", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const guestNameInput = screen.getByLabelText("Optional Guest Name");
            await expect.element(guestNameInput).toHaveValue("");

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));
            await expect.element(timeInput).toHaveValue(generateInitialState().time);

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(generateInitialState().numberOfGuests);

            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );
            await expect.element(consumptionInput).toHaveValue(generateInitialState().consumption);

            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("");

            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect.element(reservationNoteInput).toHaveValue("");

            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).not.toBeChecked();
        });

        it("renders the form with initial values in 'update' mode", async () => {
            props.mode = "update";
            props.reservationData = {
                id: "foo",
                ...generateUpdateState(),
                creator: {
                    createdAt: Date.now(),
                    email: "example@mail.com",
                    id: "user1",
                    name: "Alice",
                },
            };

            const screen = renderComponent(EventCreateReservation, props);

            // No button to switch the mode
            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await expect.element(walkInBtn).not.toBeInTheDocument();

            // Check that guest name input has the correct value
            const guestNameInput = screen.getByLabelText("Optional Guest Name");
            await expect.element(guestNameInput).toHaveValue(props.reservationData?.guestName);

            // Check that time input has the correct value
            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));
            await expect.element(timeInput).toHaveValue(props.reservationData?.time);

            // Check that number of guests input has the correct value
            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(props.reservationData?.numberOfGuests);

            // Check that consumption input has the correct value
            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );
            await expect.element(consumptionInput).toHaveValue(props.reservationData?.consumption);

            // Check that guest contact input has the correct value
            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("666666666");

            // Check that reservation note input has the correct value
            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect
                .element(reservationNoteInput)
                .toHaveValue(props.reservationData?.reservationNote);

            // Check that isVIP checkbox is checked
            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).toBeChecked();
        });

        it("shows reset button only in update mode and resets form values", async () => {
            const screen = renderComponent(EventCreateReservation, props);
            const resetBtn = screen.getByRole("button", { name: t("Global.reset") });
            await expect.element(resetBtn).not.toBeInTheDocument();

            props.mode = "update";
            props.reservationData = {
                id: "foo",
                ...generateUpdateState(),
                creator: {
                    createdAt: Date.now(),
                    email: "example@mail.com",
                    id: "user1",
                    name: "Alice",
                },
            };

            screen.rerender(props);

            const guestNameInput = screen.getByLabelText("Optional Guest Name");
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Modified Name");

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await userEvent.clear(numberOfGuestsInput);
            await userEvent.type(numberOfGuestsInput, "8");

            const resetButton = screen.getByRole("button", { name: t("Global.reset") });
            await userEvent.click(resetButton);

            await expect.element(guestNameInput).toHaveValue("John Doe");
            await expect.element(numberOfGuestsInput).toHaveValue(4);
        });

        it("validates guest name length", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const guestNameInput = screen.getByLabelText("Optional Guest Name");

            await userEvent.type(guestNameInput, "A");

            const submitBtn = screen.getByRole("button", { name: t(`Global.submit`) });
            await userEvent.click(submitBtn);

            const errorMessage = screen.getByText(t("validation.nameMustBeLongerErrorMsg"));
            await expect.element(errorMessage).toBeVisible();
        });

        it("sets initial time to current hour when event is in progress", async () => {
            const now = Date.now();
            // Event started an hour ago
            props.eventStartTimestamp = now - ONE_HOUR;

            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));

            const expectedTime = hourFromTimestamp(
                now,
                getLocaleForTest().value,
                getDefaultTimezone(),
            );

            await expect.element(timeInput).toHaveValue(expectedTime);
        });

        it("opens the time picker and selects a time correctly", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));
            await expect.element(timeInput).toHaveValue(generateInitialState().time);

            // Simulate clicking the clock icon to open the time picker
            const clockIcon = document.querySelector(".v-icon");
            await userEvent.click(clockIcon!);

            const newTime = addHours(eventStartTimestamp, 2);

            let formattedNewTime = format(newTime, "H");
            // Quasar shows 00 and then goes 1, 2, 3, ..., 9, 10, 11, 12
            if (formattedNewTime === "0") {
                formattedNewTime = "00";
            }

            const timeOption = screen.getByText(formattedNewTime, { exact: true });
            await userEvent.click(timeOption.first());

            await userEvent.tab();
            await userEvent.tab();
            await userEvent.tab();

            await expect.element(timeInput).toHaveValue(format(newTime, "HH:mm"));
        });

        it("disables reset button when no changes are made and enables it when changes exist", async () => {
            props.mode = "update";
            props.reservationData = {
                id: "foo",
                ...generateUpdateState(),
                creator: {
                    createdAt: Date.now(),
                    email: "example@mail.com",
                    id: "user1",
                    name: "Alice",
                },
            };

            const screen = renderComponent(EventCreateReservation, props);

            // Reset button should be disabled initially
            const resetButton = screen.getByRole("button", { name: t("Global.reset") });
            await expect.element(resetButton).toBeDisabled();

            // Make a change to the form
            const guestNameInput = screen.getByLabelText("Optional Guest Name");
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Modified Name");

            // Reset button should be enabled after changes
            await expect.element(resetButton).toBeEnabled();
            // Reset the form
            await userEvent.click(resetButton);
            // Reset button should be disabled again after reset
            await expect.element(resetButton).toBeDisabled();
        });
    });

    describe("PlannedReservationForm", () => {
        let plannedProps: EventCreateReservationProps;

        beforeEach(() => {
            plannedProps = {
                currentUser: {
                    email: "alice@example.com",
                    id: "user1",
                    name: "Alice",
                } as User,
                eventDurationInHours: 8,
                eventStartTimestamp,
                mode: "create",
                reservationData: undefined,
                timezone: getDefaultTimezone(),
                users: [
                    { email: "alice@example.com", id: "user1", name: "Alice" } as User,
                    { email: "bob@example.com", id: "user2", name: "Bob" } as User,
                ],
            };
        });

        function generateInitialPlannedState(): Omit<PlannedReservation, "creator"> {
            return {
                arrived: false,
                cancelled: false,
                consumption: 1,
                floorId: "",
                guestContact: "",
                guestName: "",
                isVIP: false,
                numberOfGuests: 2,
                reservationConfirmed: false,
                reservationNote: "",
                reservedBy: null as unknown as User,
                state: ReservationState.PENDING,
                status: ReservationStatus.ACTIVE,
                tableLabel: "",
                time: "00:00",
                type: ReservationType.PLANNED,
            };
        }

        function generateUpdatePlannedState(): Omit<PlannedReservation, "creator"> {
            return {
                arrived: false,
                cancelled: false,
                consumption: 100,
                floorId: "",
                guestContact: "+432313213",
                guestName: "Charlie",
                isVIP: true,
                numberOfGuests: 5,
                reservationConfirmed: true,
                reservationNote: "Anniversary party",
                reservedBy: {
                    email: "bob@example.com",
                    id: "user2",
                    name: "Bob",
                },
                state: ReservationState.PENDING,
                status: ReservationStatus.ACTIVE,
                tableLabel: "",
                time: "20:00",
                type: ReservationType.PLANNED,
            };
        }

        it("renders the form with initial values in 'create' mode", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await expect.element(guestNameInput).toHaveValue("");

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"), {
                exact: true,
            });
            await expect.element(timeInput).toHaveValue(generateInitialPlannedState().time);

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(generateInitialPlannedState().numberOfGuests);

            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );
            await expect
                .element(consumptionInput)
                .toHaveValue(generateInitialPlannedState().consumption);

            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("");

            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect.element(reservationNoteInput).toHaveValue("");

            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).not.toBeChecked();

            // Check that selectionType is defaulted to "user"
            const userRadio = screen.getByRole("radio", { name: "Staff" });
            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await expect.element(userRadio).toBeChecked();
            await expect.element(socialRadio).not.toBeChecked();

            // Check that reservedBy select has the first user selected
            const reservedBySelect = screen.getByLabelText(
                t("EventCreateReservation.reservedByLabel"),
            );
            await expect.element(reservedBySelect).toHaveValue("");
        });

        it("renders the form with initial values in 'update' mode", async () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = {
                ...generateUpdatePlannedState(),
                creator: {
                    createdAt: Date.now(),
                    email: "",
                    id: "user1",
                    name: "Alice",
                },
            } as unknown as PlannedReservationDoc;

            const screen = renderComponent(EventCreateReservation, plannedProps);

            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await expect
                .element(guestNameInput)
                .toHaveValue(plannedProps.reservationData?.guestName);

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"), {
                exact: true,
            });
            await expect.element(timeInput).toHaveValue(plannedProps.reservationData?.time);

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(plannedProps.reservationData?.numberOfGuests);

            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );

            await expect
                .element(consumptionInput)
                .toHaveValue(plannedProps.reservationData?.consumption);

            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("2313213");

            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect
                .element(reservationNoteInput)
                .toHaveValue(plannedProps.reservationData?.reservationNote);

            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).toBeChecked();

            // Check that selectionType is set based on reservationData
            const userRadio = screen.getByRole("radio", { name: "Staff" });
            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await expect.element(userRadio).toBeChecked();
            await expect.element(socialRadio).not.toBeChecked();

            const reservedBySelect = screen.getByLabelText(
                t("EventCreateReservation.reservedByLabel"),
            );
            await expect
                .element(reservedBySelect)
                .toHaveValue(plannedProps.reservationData?.reservedBy?.email);
        });

        it("shows reset button only in update mode and resets form values", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            const resetBtn = screen.getByRole("button", { name: t("Global.reset") });
            await expect.element(resetBtn).not.toBeInTheDocument();

            plannedProps.mode = "update";
            plannedProps.reservationData = {
                ...generateUpdatePlannedState(),
                creator: {
                    createdAt: Date.now(),
                    email: "",
                    id: "user1",
                    name: "Alice",
                },
            } as unknown as PlannedReservationDoc;

            screen.rerender(plannedProps);

            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Modified Name");

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await userEvent.clear(numberOfGuestsInput);
            await userEvent.type(numberOfGuestsInput, "8");

            const resetButton = screen.getByRole("button", { name: t("Global.reset") });
            await userEvent.click(resetButton);

            await expect.element(guestNameInput).toHaveValue("Charlie");
            await expect.element(numberOfGuestsInput).toHaveValue(5);
        });

        it("validates guest name and reservedBy selection", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Fill in guest name with insufficient length
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );

            await userEvent.type(guestNameInput, "A");

            // Attempt to submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check for validation error
            const errorMessage = screen.getByText(t("validation.nameMustBeLongerErrorMsg"));
            await expect.element(errorMessage).toBeVisible();

            // Check for reservedBy validation error
            const reservedByError = screen.getByText(
                t("EventCreateReservation.requireReservedBySelectionError"),
            );
            await expect.element(reservedByError).toBeVisible();
        });

        it("allows user to select reservedBy as 'User' and emits the correct payload", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.type(guestNameInput, "David");

            const userRadio = screen.getByRole("radio", { name: "Staff" });
            await userEvent.click(userRadio);

            const reservedBySelect = screen.getByLabelText(
                t("EventCreateReservation.reservedByLabel"),
            );
            await userEvent.click(reservedBySelect, { force: true });
            const firstUserOption = screen.getByText(plannedProps.users[0].name);
            await userEvent.click(firstUserOption);

            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            const emitted = screen.emitted().create as PlannedReservation[][];
            expect(emitted).toBeTruthy();
            const emittedPayload = emitted[0][0];

            expect(emittedPayload.guestName).toBe("David");
            expect(emittedPayload.reservedBy.email).toBe(plannedProps.users[0].email);
            expect(emittedPayload.reservedBy.name).toBe(plannedProps.users[0].name);
            expect(emittedPayload.reservedBy.id).toBe(plannedProps.users[0].id);
        });

        it("allows user to select reservedBy as 'Social' and emits the correct payload", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.type(guestNameInput, "Eve");

            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await userEvent.click(socialRadio);

            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            const emitted = screen.emitted().create as PlannedReservation[][];
            expect(emitted).toBeTruthy();
            const emittedPayload = emitted[0][0];

            expect(emittedPayload.guestName).toBe("Eve");
            expect(emittedPayload.reservedBy.email).toBe("social-0");
            expect(emittedPayload.reservedBy.name).toBe("Whatsapp");
            expect(emittedPayload.reservedBy.id).toBe("");
        });

        it("emits 'update' event with correct payload in 'update' mode", async () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = {
                ...generateUpdatePlannedState(),
                creator: {
                    createdAt: Date.now(),
                    email: "",
                    id: "user1",
                    name: "Alice",
                },
            } as unknown as PlannedReservationDoc;

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Modify guest name
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Charlie Updated");

            const socialRadioBtn = screen.getByRole("radio", { name: "Social Networks" });
            await userEvent.click(socialRadioBtn);

            // Change reservedBy to another user
            const reservedBySelect = screen.getByRole("textbox", {
                name: t("EventCreateReservation.reservedBySocialLabel"),
            });
            await userEvent.click(reservedBySelect, { force: true });
            const smsOption = screen.getByText("SMS");
            await userEvent.click(smsOption);

            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            const emitted = screen.emitted().update as PlannedReservation[][];
            expect(emitted).toBeTruthy();
            const emittedPayload = emitted[0][0];

            expect(emittedPayload.guestName).toBe("Charlie Updated");
            expect(emittedPayload.reservedBy.email).toBe("social-1");
            expect(emittedPayload.reservedBy.name).toBe("SMS");
            expect(emittedPayload.reservedBy.id).toBe("");
        });

        it("disables reset button when no changes are made and enables it when changes exist", async () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = {
                ...generateUpdatePlannedState(),
                creator: {
                    createdAt: Date.now(),
                    email: "",
                    id: "user1",
                    name: "Alice",
                },
            } as unknown as PlannedReservationDoc;

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Reset button should be disabled initially
            const resetButton = screen.getByRole("button", { name: t("Global.reset") });
            await expect.element(resetButton).toBeDisabled();
            // Make a change to the form
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Modified Name");
            // Reset button should be enabled after changes
            await expect.element(resetButton).toBeEnabled();
            // Reset the form
            await userEvent.click(resetButton);
            // Reset button should be disabled again after reset
            await expect.element(resetButton).toBeDisabled();

            // Make multiple changes
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Another Name");

            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await userEvent.clear(numberOfGuestsInput);
            await userEvent.type(numberOfGuestsInput, "8");

            // Reset button should still be enabled
            await expect.element(resetButton).toBeEnabled();
            // Reset the form again
            await userEvent.click(resetButton);
            // Reset button should be disabled after reset
            await expect.element(resetButton).toBeDisabled();
        });
    });
});
