import type { PlannedReservation, User, WalkInReservation } from "@firetable/types";
import type { EventCreateReservationProps } from "./EventCreateReservation.vue";
import type { PlannedReservationFormProps } from "./PlannedReservationForm.vue";
import EventCreateReservation from "./EventCreateReservation.vue";
import { hourFromTimestamp } from "../../../helpers/date-utils";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { ONE_HOUR } from "../../../constants";
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
                mode: "create",
                eventStartTimestamp,
                table: {
                    id: "table1",
                    label: "Table 1",
                },
                floorId: "floor1",
                reservationData: undefined,
                eventDurationInHours: 8,
                users: [],
                currentUser: {},
            };
        });

        // Helper function to generate initial state for "create" mode
        function generateInitialState(): Omit<WalkInReservation, "creator"> {
            const eventStart = props.eventStartTimestamp;
            const now = Date.now();
            const initialTime = Math.max(now, eventStart);
            const formattedTime = hourFromTimestamp(initialTime, null);
            return {
                type: ReservationType.WALK_IN,
                guestName: null,
                numberOfGuests: 2,
                guestContact: "",
                reservationNote: "",
                consumption: 0,
                arrived: true,
                time: formattedTime,
                tableLabel: props.table.label,
                floorId: props.floorId,
                status: ReservationStatus.ACTIVE,
                isVIP: false,
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
                tableLabel: props.table.label,
                floorId: props.floorId,
                status: ReservationStatus.ACTIVE,
                isVIP: true,
            };
        }

        it("renders the form with initial values in 'create' mode", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            // Check that guest name input is empty
            const guestNameInput = screen.getByLabelText("Optional Guest Name").query();
            expect(guestNameInput.getAttribute("value")).toBe("");

            // Check that time input has the correct initial value
            const timeInput = screen
                .getByLabelText(t("EventCreateReservation.reservationTime"))
                .query();
            expect(timeInput.getAttribute("value")).toBe(generateInitialState().time);

            // Check that number of guests input has default value
            const numberOfGuestsInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNumberOfGuests"))
                .query();
            expect(Number(numberOfGuestsInput.getAttribute("value"))).toBe(
                generateInitialState().numberOfGuests,
            );

            // Check that consumption input has default value
            const consumptionInput = screen
                .getByLabelText(t("EventCreateReservation.reservationConsumption"))
                .query();
            expect(Number(consumptionInput.getAttribute("value"))).toBe(
                generateInitialState().consumption,
            );

            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number").query();
            expect(guestContactInput.getAttribute("value")).toBe("");

            // Check that reservation note input is empty
            const reservationNoteInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNote"))
                .query();
            expect(reservationNoteInput.getAttribute("value")).toBe("");

            // Check that isVIP checkbox is unchecked
            const isVIPCheckbox = screen
                .getByLabelText(t("EventCreateReservation.reservationVIP"))
                .query();
            expect(isVIPCheckbox.getAttribute("aria-checked")).toBe("false");
        });

        it("renders the form with initial values in 'update' mode", () => {
            props.mode = "update";
            props.reservationData = generateUpdateState();

            const screen = renderComponent(EventCreateReservation, props);

            // No button to switch the mode
            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            expect(walkInBtn.query()).toBeFalsy();

            // Check that guest name input has the correct value
            const guestNameInput = screen.getByLabelText("Optional Guest Name").query();
            expect(guestNameInput.getAttribute("value")).toBe(props.reservationData?.guestName);

            // Check that time input has the correct value
            const timeInput = screen
                .getByLabelText(t("EventCreateReservation.reservationTime"))
                .query();
            expect(timeInput.getAttribute("value")).toBe(props.reservationData?.time);

            // Check that number of guests input has the correct value
            const numberOfGuestsInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNumberOfGuests"))
                .query();
            expect(Number(numberOfGuestsInput.getAttribute("value"))).toBe(
                props.reservationData?.numberOfGuests,
            );

            // Check that consumption input has the correct value
            const consumptionInput = screen
                .getByLabelText(t("EventCreateReservation.reservationConsumption"))
                .query();
            expect(Number(consumptionInput.getAttribute("value"))).toBe(
                props.reservationData?.consumption,
            );

            // Check that guest contact input has the correct value
            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number").query();
            expect(guestContactInput.getAttribute("value")).toBe("666666666");

            // Check that reservation note input has the correct value
            const reservationNoteInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNote"))
                .query();
            expect(reservationNoteInput.getAttribute("value")).toBe(
                props.reservationData?.reservationNote,
            );

            // Check that isVIP checkbox is checked
            const isVIPCheckbox = screen
                .getByLabelText(t("EventCreateReservation.reservationVIP"))
                .query();
            expect(isVIPCheckbox.getAttribute("aria-checked")).toBe("true");
        });

        it("validates guest name length", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const guestNameInput = screen.getByLabelText("Optional Guest Name").query();

            await userEvent.type(guestNameInput, "A");

            const submitBtn = screen.getByRole("button", { name: t(`Global.submit`) });
            await userEvent.click(submitBtn);

            const errorMessage = screen.getByText("Name must be longer!");
            expect(errorMessage.query()).toBeTruthy();
        });

        it("opens the time picker and selects a time correctly", async () => {
            const screen = renderComponent(EventCreateReservation, props);

            const walkInBtn = screen.getByRole("button", { name: "Walk-In" });
            await userEvent.click(walkInBtn);

            const timeInput = screen
                .getByLabelText(t("EventCreateReservation.reservationTime"))
                .query();
            expect(timeInput.getAttribute("value")).toBe(generateInitialState().time);

            // Simulate clicking the clock icon to open the time picker
            const clockIcon = screen.getByText("clock");
            await userEvent.click(clockIcon);

            const newTime = addHours(eventStartTimestamp, 1);

            const timeOption = screen.getByText(format(newTime, "HH"));
            expect(timeOption.query()).toBeTruthy();

            await userEvent.click(timeOption);
            const closeBtn = screen.getByRole("button", { name: "Close" });
            await userEvent.click(closeBtn);

            expect(timeInput.getAttribute("value")).toBe(format(newTime, "HH:mm"));
        });
    });

    describe("PlannedReservationForm", () => {
        let plannedProps: PlannedReservationFormProps;

        beforeEach(() => {
            plannedProps = {
                currentUser: {
                    id: "user1",
                    name: "Alice",
                    email: "alice@example.com",
                },
                users: [
                    { id: "user1", name: "Alice", email: "alice@example.com" },
                    { id: "user2", name: "Bob", email: "bob@example.com" },
                ],
                mode: "create",
                eventStartTimestamp,
                table: {
                    id: "table1",
                    label: "Table 1",
                },
                floorId: "floor1",
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
                tableLabel: plannedProps.table.label,
                floorId: plannedProps.floorId,
                status: ReservationStatus.ACTIVE,
                isVIP: false,
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
                tableLabel: plannedProps.table.label,
                floorId: plannedProps.floorId,
                status: ReservationStatus.ACTIVE,
                isVIP: true,
            };
        }

        it("renders the form with initial values in 'create' mode", () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Check that guest name input is empty
            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            expect(guestNameInput.getAttribute("value")).toBe("");

            // Check that time input has the correct initial value
            const timeInput = screen
                .getByLabelText(t("EventCreateReservation.reservationTime"))
                .query();
            expect(timeInput.getAttribute("value")).toBe(generateInitialPlannedState().time);

            // Check that number of guests input has default value
            const numberOfGuestsInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNumberOfGuests"))
                .query();
            expect(Number(numberOfGuestsInput.getAttribute("value"))).toBe(
                generateInitialPlannedState().numberOfGuests,
            );

            // Check that consumption input has default value
            const consumptionInput = screen
                .getByLabelText(t("EventCreateReservation.reservationConsumption"))
                .query();
            expect(Number(consumptionInput.getAttribute("value"))).toBe(
                generateInitialPlannedState().consumption,
            );

            // Check that guest contact input is empty
            const guestContactInput = screen.getByLabelText("Phone Number").query();
            expect(guestContactInput.getAttribute("value")).toBe("");

            // Check that reservation note input is empty
            const reservationNoteInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNote"))
                .query();
            expect(reservationNoteInput.getAttribute("value")).toBe("");

            // Check that isVIP checkbox is unchecked
            const isVIPCheckbox = screen
                .getByLabelText(t("EventCreateReservation.reservationVIP"))
                .query();
            expect(isVIPCheckbox.getAttribute("aria-checked")).toBe("false");

            // Check that selectionType is defaulted to "user"
            const userRadio = screen.getByRole("radio", { name: "Staff" }).query();
            const socialRadio = screen.getByRole("radio", { name: "Social" }).query();
            expect(userRadio.getAttribute("aria-checked")).toBe("true");
            expect(socialRadio.getAttribute("aria-checked")).toBe("false");

            // Check that reservedBy select has the first user selected
            const reservedBySelect = screen
                .getByRole("combobox", { name: t("EventCreateReservation.reservedByLabel") })
                .query();
            expect(reservedBySelect.getAttribute("value")).toBe("");
        });

        it("renders the form with initial values in 'update' mode", () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = generateUpdatePlannedState();

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Check that guest name input has the correct value
            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            expect(guestNameInput.getAttribute("value")).toBe(
                plannedProps.reservationData?.guestName,
            );

            // Check that time input has the correct value
            const timeInput = screen
                .getByLabelText(t("EventCreateReservation.reservationTime"))
                .query();
            expect(timeInput.getAttribute("value")).toBe(plannedProps.reservationData?.time);

            // Check that number of guests input has the correct value
            const numberOfGuestsInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNumberOfGuests"))
                .query();
            expect(Number(numberOfGuestsInput.getAttribute("value"))).toBe(
                plannedProps.reservationData?.numberOfGuests,
            );

            // Check that consumption input has the correct value
            const consumptionInput = screen
                .getByLabelText(t("EventCreateReservation.reservationConsumption"))
                .query();
            expect(Number(consumptionInput.getAttribute("value"))).toBe(
                plannedProps.reservationData?.consumption,
            );

            // Check that guest contact input has the correct value
            const guestContactInput = screen.getByLabelText("Phone Number").query();
            expect(guestContactInput.getAttribute("value")).toBe("2313213");

            // Check that reservation note input has the correct value
            const reservationNoteInput = screen
                .getByLabelText(t("EventCreateReservation.reservationNote"))
                .query();
            expect(reservationNoteInput.getAttribute("value")).toBe(
                plannedProps.reservationData?.reservationNote,
            );

            // Check that isVIP checkbox is checked
            const isVIPCheckbox = screen
                .getByLabelText(t("EventCreateReservation.reservationVIP"))
                .query();
            expect(isVIPCheckbox.getAttribute("aria-checked")).toBe("true");

            // Check that selectionType is set based on reservationData
            const userRadio = screen.getByRole("radio", { name: "Staff" }).query();
            const socialRadio = screen.getByRole("radio", { name: "Social" }).query();
            expect(userRadio.getAttribute("aria-checked")).toBe("true");
            expect(socialRadio.getAttribute("aria-checked")).toBe("false");

            // Check that reservedBy select has the correct user selected
            const reservedBySelect = screen
                .getByRole("combobox", { name: t("EventCreateReservation.reservedByLabel") })
                .query();
            expect(reservedBySelect.getAttribute("value")).toBe(
                plannedProps.reservationData?.reservedBy?.name,
            );
        });

        it("validates guest name and reservedBy selection", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Fill in guest name with insufficient length
            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            await userEvent.type(guestNameInput, "A");

            // Attempt to submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check for validation error
            const errorMessage = screen.getByText("Name must be longer!");
            expect(errorMessage.query()).toBeTruthy();

            // Check for reservedBy validation error
            const reservedByError = screen.getByText(
                t("EventCreateReservation.requireReservedBySelectionError"),
            );
            expect(reservedByError.query()).toBeTruthy();
        });

        it("allows user to select reservedBy as 'User' and emits the correct payload", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            await userEvent.type(guestNameInput, "David");

            // Select reservedBy as 'User' (Staff)
            const userRadio = screen.getByRole("radio", { name: "Staff" }).query();
            await userEvent.click(userRadio);

            const reservedBySelect = screen
                .getByRole("combobox", { name: t("EventCreateReservation.reservedByLabel") })
                .query();
            await userEvent.click(reservedBySelect);
            const firstUserOption = screen.getByText(plannedProps.users[0].name);
            await userEvent.click(firstUserOption);

            // Submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            expect(screen.emitted().create).toBeTruthy();
            const emittedPayload = screen.emitted().create[0][0] as PlannedReservation;

            expect(emittedPayload.guestName).toBe("David");
            expect(emittedPayload.reservedBy.email).toBe(plannedProps.users[0].email);
            expect(emittedPayload.reservedBy.name).toBe(plannedProps.users[0].name);
            expect(emittedPayload.reservedBy.id).toBe(plannedProps.users[0].id);
        });

        it("allows user to select reservedBy as 'Social' and emits the correct payload", async () => {
            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Fill in guest name
            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            await userEvent.type(guestNameInput, "Eve");

            // Select reservedBy as 'Social'
            const socialRadio = screen.getByRole("radio", { name: "Social" }).query();
            await userEvent.click(socialRadio);

            // Submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check that the 'create' event is emitted with correct payload
            expect(screen.emitted().create).toBeTruthy();
            const emittedPayload = screen.emitted().create[0][0] as PlannedReservation;

            expect(emittedPayload.guestName).toBe("Eve");
            expect(emittedPayload.reservedBy.email).toBe("social-0");
            expect(emittedPayload.reservedBy.name).toBe("Whatsapp");
            expect(emittedPayload.reservedBy.id).toBe("");
        });

        it("emits 'update' event with correct payload in 'update' mode", async () => {
            plannedProps.mode = "update";
            plannedProps.reservationData = generateUpdatePlannedState();

            const screen = renderComponent(EventCreateReservation, plannedProps);

            // Modify guest name
            const guestNameInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestName"))
                .query();
            await userEvent.clear(guestNameInput);
            await userEvent.type(guestNameInput, "Charlie Updated");

            const socialRadioBtn = screen.getByRole("radio", { name: "Social" });
            await userEvent.click(socialRadioBtn);

            // Change reservedBy to another user
            const reservedBySelect = screen
                .getByRole("combobox", { name: t("EventCreateReservation.reservedBySocialLabel") })
                .query();
            await userEvent.click(reservedBySelect);
            // Selecting 'SMS'
            const smsOption = screen.getByText("SMS");
            await userEvent.click(smsOption);

            // Submit the form
            const okBtn = screen.getByRole("button", { name: t("Global.submit") });
            await userEvent.click(okBtn);

            // Check that the 'update' event is emitted with correct payload
            expect(screen.emitted().update).toBeTruthy();
            const emittedPayload = screen.emitted().update[0][0] as PlannedReservation;

            expect(emittedPayload.guestName).toBe("Charlie Updated");
            expect(emittedPayload.reservedBy.email).toBe("social-1");
            expect(emittedPayload.reservedBy.name).toBe("SMS");
            expect(emittedPayload.reservedBy.id).toBe("");
        });
    });
});
