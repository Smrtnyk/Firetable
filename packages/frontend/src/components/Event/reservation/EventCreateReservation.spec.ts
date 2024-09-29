import type { WalkInReservation } from "@firetable/types";
import type { EventCreateReservationProps } from "./EventCreateReservation.vue";
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
            const initialTime = now > eventStart ? now : eventStart;
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
                guestContact: "john.doe@example.com",
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
            const guestContactInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestContact"))
                .query();
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
            const guestContactInput = screen
                .getByLabelText(t("EventCreateReservation.reservationGuestContact"))
                .query();
            expect(guestContactInput.getAttribute("value")).toBe(
                props.reservationData?.guestContact,
            );

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

            const timeOption = screen.getByText(newTime.getHours().toString());
            expect(timeOption.query()).toBeTruthy();

            await userEvent.click(timeOption);
            const closeBtn = screen.getByRole("button", { name: "Close" });
            await userEvent.click(closeBtn);

            expect(timeInput.getAttribute("value")).toBe(format(newTime, "HH:mm"));
        });
    });
});
