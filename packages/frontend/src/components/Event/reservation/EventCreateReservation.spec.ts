import type {
    PlannedReservation,
    PlannedReservationDoc,
    User,
    WalkInReservation,
} from "@firetable/types";
import type { EventCreateReservationProps } from "./EventCreateReservation.vue";
import EventCreateReservation from "./EventCreateReservation.vue";
import { renderComponent, t, locale } from "../../../../test-helpers/render-component";
import { getDefaultTimezone, hourFromTimestamp } from "src/helpers/date-utils";
import { ONE_HOUR } from "src/constants";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { describe, expect, it, beforeEach } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { addHours, format } from "date-fns";

const eventStartTimestamp = Date.now() + ONE_HOUR;

describe("EventCreateReservation", () => {
    let props: EventCreateReservationProps;

    describe("WalkIn", () => {
        beforeEach(() => {
            props = {
                timezone: getDefaultTimezone(),
                mode: "create",
                eventStartTimestamp,
                eventDurationInHours: 8,
                users: [],
                currentUser: {
                    id: "user1",
                    name: "Alice",
                    email: "example@mail.com",
                } as User,
            };
        });

        // Helper function to generate initial state for "create" mode
        function generateInitialState(): Omit<WalkInReservation, "creator"> {
            const eventStart = props.eventStartTimestamp;
            const now = Date.now();
            const initialTime = Math.max(now, eventStart);
            const formattedTime = hourFromTimestamp(
                initialTime,
                locale.value,
                getDefaultTimezone(),
            );
            return {
                type: ReservationType.WALK_IN,
                guestName: "",
                numberOfGuests: 2,
                guestContact: "",
                reservationNote: "",
                consumption: 0,
                arrived: true,
                time: formattedTime,
                status: ReservationStatus.ACTIVE,
                isVIP: false,
                floorId: "",
                tableLabel: "",
            };
        }

        // Helper function to generate initial state for "update" mode
        function generateUpdateState(): Omit<WalkInReservation, "creator"> {
            return {
                type: ReservationType.WALK_IN,
                guestName: "John Doe",
                numberOfGuests: 4,
                guestContact: "+43666666666",
                reservationNote: "Birthday celebration",
                consumption: 50,
                arrived: true,
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                isVIP: true,
                floorId: "",
                tableLabel: "",
            };
        }

        it("renders the form with initial values in 'create' mode", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            // Check that guest name input is empty
            const guestNameInput = screen.getByLabelText("Optional Guest Name");
            await expect.element(guestNameInput).toHaveValue("");

            // Check that time input has the correct initial value
            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));
            await expect.element(timeInput).toHaveValue(generateInitialState().time);

            // Check that number of guests input has default value
            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(generateInitialState().numberOfGuests);

            // Check that consumption input has default value
            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );
            await expect.element(consumptionInput).toHaveValue(generateInitialState().consumption);

            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("");

            // Check that reservation note input is empty
            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect.element(reservationNoteInput).toHaveValue("");

            // Check that isVIP checkbox is unchecked
            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).not.toBeChecked();
        });

        it("renders the form with initial values in 'update' mode", async () => {
            props.mode = "update";
            props.reservationData = {
                id: "foo",
                ...generateUpdateState(),
                creator: {
                    id: "user1",
                    name: "Alice",
                    email: "example@mail.com",
                    createdAt: Date.now(),
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

        it("opens the time picker and selects a time correctly", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"));
            await expect.element(timeInput).toHaveValue(generateInitialState().time);

            // Simulate clicking the clock icon to open the time picker
            const clockIcon = document.querySelector(".q-icon");
            await userEvent.click(clockIcon!);

            const newTime = addHours(eventStartTimestamp, 1);

            let formattedNewTime = format(newTime, "H");
            // Quasar shows 00 and then goes 1, 2, 3, ..., 9, 10, 11, 12
            if (formattedNewTime === "0") {
                formattedNewTime = "00";
            }

            const timeOption = screen.getByText(formattedNewTime, { exact: true });
            await userEvent.click(timeOption);

            const closeBtn = screen.getByRole("button", { name: "Close" });
            await userEvent.click(closeBtn);

            await expect.element(timeInput).toHaveValue(format(newTime, "HH:mm"));
        });
    });

    describe("PlannedReservationForm", () => {
        let plannedProps: EventCreateReservationProps;

        beforeEach(() => {
            plannedProps = {
                timezone: getDefaultTimezone(),
                currentUser: {
                    id: "user1",
                    name: "Alice",
                    email: "alice@example.com",
                } as User,
                users: [
                    { id: "user1", name: "Alice", email: "alice@example.com" } as User,
                    { id: "user2", name: "Bob", email: "bob@example.com" } as User,
                ],
                mode: "create",
                eventStartTimestamp,
                reservationData: undefined,
                eventDurationInHours: 8,
            };
        });

        // Helper function to generate initial state for "create" mode
        function generateInitialPlannedState(): Omit<PlannedReservation, "creator"> {
            return {
                type: ReservationType.PLANNED,
                guestName: "",
                numberOfGuests: 2,
                guestContact: "",
                reservationNote: "",
                consumption: 1,
                arrived: false,
                reservationConfirmed: false,
                time: "00:00",
                reservedBy: null as unknown as User,
                cancelled: false,
                status: ReservationStatus.ACTIVE,
                isVIP: false,
                floorId: "",
                tableLabel: "",
            };
        }

        // Helper function to generate initial state for "update" mode
        function generateUpdatePlannedState(): Omit<PlannedReservation, "creator"> {
            return {
                type: ReservationType.PLANNED,
                guestName: "Charlie",
                numberOfGuests: 5,
                guestContact: "+432313213",
                reservationNote: "Anniversary party",
                consumption: 100,
                arrived: false,
                reservationConfirmed: true,
                time: "20:00",
                reservedBy: {
                    name: "Bob",
                    email: "bob@example.com",
                    id: "user2",
                },
                cancelled: false,
                status: ReservationStatus.ACTIVE,
                isVIP: true,
                floorId: "",
                tableLabel: "",
            };
        }

        it("renders the form with initial values in 'create' mode", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Check that guest name input is empty
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await expect.element(guestNameInput).toHaveValue("");

            // Check that time input has the correct initial value
            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"), {
                exact: true,
            });
            await expect.element(timeInput).toHaveValue(generateInitialPlannedState().time);

            // Check that number of guests input has default value
            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(generateInitialPlannedState().numberOfGuests);

            // Check that consumption input has default value
            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );
            await expect
                .element(consumptionInput)
                .toHaveValue(generateInitialPlannedState().consumption);

            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("");

            // Check that reservation note input is empty
            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect.element(reservationNoteInput).toHaveValue("");

            // Check that isVIP checkbox is unchecked
            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).not.toBeChecked();

            // Check that selectionType is defaulted to "user"
            const userRadio = screen.getByRole("radio", { name: "Staff" });
            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await expect.element(userRadio).toBeChecked();
            await expect.element(socialRadio).not.toBeChecked();

            // Check that reservedBy select has the first user selected
            const reservedBySelect = screen.getByRole("combobox", {
                name: t("EventCreateReservation.reservedByLabel"),
            });
            await expect.element(reservedBySelect).toHaveValue("");
        });

        it("renders the form with initial values in 'update' mode", async () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = {
                ...generateUpdatePlannedState(),
                creator: {
                    id: "user1",
                    name: "Alice",
                    email: "",
                    createdAt: Date.now(),
                },
            } as unknown as PlannedReservationDoc;

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Check that guest name input has the correct value
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await expect
                .element(guestNameInput)
                .toHaveValue(plannedProps.reservationData?.guestName);

            // Check that time input has the correct value
            const timeInput = screen.getByLabelText(t("EventCreateReservation.reservationTime"), {
                exact: true,
            });
            await expect.element(timeInput).toHaveValue(plannedProps.reservationData?.time);

            // Check that number of guests input has the correct value
            const numberOfGuestsInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNumberOfGuests"),
            );
            await expect
                .element(numberOfGuestsInput)
                .toHaveValue(plannedProps.reservationData?.numberOfGuests);

            // Check that consumption input has the correct value
            const consumptionInput = screen.getByLabelText(
                t("EventCreateReservation.reservationConsumption"),
            );

            await expect
                .element(consumptionInput)
                .toHaveValue(plannedProps.reservationData?.consumption);

            // Check that guest contact input has the correct value
            const guestContactInput = screen.getByLabelText("Phone Number");
            await expect.element(guestContactInput).toHaveValue("2313213");

            // Check that reservation note input has the correct value
            const reservationNoteInput = screen.getByLabelText(
                t("EventCreateReservation.reservationNote"),
            );
            await expect
                .element(reservationNoteInput)
                .toHaveValue(plannedProps.reservationData?.reservationNote);

            // Check that isVIP checkbox is checked
            const isVIPCheckbox = screen.getByLabelText(t("EventCreateReservation.reservationVIP"));
            await expect.element(isVIPCheckbox).toBeChecked();

            // Check that selectionType is set based on reservationData
            const userRadio = screen.getByRole("radio", { name: "Staff" });
            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await expect.element(userRadio).toBeChecked();
            await expect.element(socialRadio).not.toBeChecked();

            // Check that reservedBy select has the correct user selected
            const reservedBySelect = screen.getByRole("combobox", {
                name: t("EventCreateReservation.reservedByLabel"),
            });
            await expect
                .element(reservedBySelect)
                .toHaveValue(plannedProps.reservationData?.reservedBy?.name);
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

            // Select reservedBy as 'User' (Staff)
            const userRadio = screen.getByRole("radio", { name: "Staff" });
            await userEvent.click(userRadio);

            const reservedBySelect = screen.getByRole("combobox", {
                name: t("EventCreateReservation.reservedByLabel"),
            });
            await userEvent.click(reservedBySelect);
            const firstUserOption = screen.getByText(plannedProps.users[0].name);
            await userEvent.click(firstUserOption);

            // Submit the form
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

            // Fill in guest name
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.type(guestNameInput, "Eve");

            // Select reservedBy as 'Social'
            const socialRadio = screen.getByRole("radio", { name: "Social" });
            await userEvent.click(socialRadio);

            // Submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check that the 'create' event is emitted with correct payload
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
                    id: "user1",
                    name: "Alice",
                    email: "",
                    createdAt: Date.now(),
                },
            } as unknown as PlannedReservationDoc;

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Modify guest name
            const guestNameInput = screen.getByLabelText(
                t("EventCreateReservation.reservationGuestName"),
            );
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Charlie Updated");

            const socialRadioBtn = screen.getByRole("radio", { name: "Social" });
            await userEvent.click(socialRadioBtn);

            // Change reservedBy to another user
            const reservedBySelect = screen.getByRole("combobox", {
                name: t("EventCreateReservation.reservedBySocialLabel"),
            });
            await userEvent.click(reservedBySelect);
            // Selecting 'SMS'
            const smsOption = screen.getByText("SMS");
            await userEvent.click(smsOption);

            // Submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check that the 'update' event is emitted with correct payload
            const emitted = screen.emitted().update as PlannedReservation[][];
            expect(emitted).toBeTruthy();
            const emittedPayload = emitted[0][0];

            expect(emittedPayload.guestName).toBe("Charlie Updated");
            expect(emittedPayload.reservedBy.email).toBe("social-1");
            expect(emittedPayload.reservedBy.name).toBe("SMS");
            expect(emittedPayload.reservedBy.id).toBe("");
        });
    });
});
