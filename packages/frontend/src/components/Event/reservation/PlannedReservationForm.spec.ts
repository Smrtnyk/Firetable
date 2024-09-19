import type { VueWrapper } from "@vue/test-utils";
import type { Reservation, ReservationDoc, User } from "@firetable/types";

import PlannedReservationForm from "./PlannedReservationForm.vue";
import messages from "../../../i18n";

import { describe, expect, it } from "vitest";
import { ReservationStatus, ReservationType } from "@firetable/types";
import { flushPromises, mount } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import {
    Quasar,
    QInput,
    QSelect,
    QIcon,
    QBtn,
    QTime,
    QPopupProxy,
    QCheckbox,
    QRadio,
    ClosePopup,
} from "quasar";

type PropsType = typeof PlannedReservationForm.props;

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

const testReservationData: Reservation = {
    guestName: "John Doe",
    numberOfGuests: 2,
    guestContact: "1234567890",
    reservationNote: "",
    consumption: 1,
    arrived: false,
    cancelled: false,
    time: "12:00",
    reservedBy: { name: "Staff", email: "staff@example.com", id: "1" },
    reservationConfirmed: false,
    floorId: "1",
    tableLabel: "1",
    creator: {
        email: "mail",
        id: "1",
        name: "name",
        createdAt: {
            nanoseconds: 1,
            seconds: 1,
        } as any,
    },
    status: ReservationStatus.ACTIVE,
    type: ReservationType.PLANNED,
    isVIP: false,
};

function createProps(overrides: Partial<PropsType> = {}): PropsType {
    const defaultProps: PropsType = {
        currentUser: MOCK_USER,
        users: [],
        mode: "create",
        reservationData: null,
        table: {
            label: "1",
        },
        floor: {
            id: "1",
        },
        eventStartTimestamp: Date.now(),
        eventDurationInHours: 8,
    };

    return { ...defaultProps, ...overrides };
}

const MOCK_USER: ReservationDoc["creator"] = {
    email: "mail",
    id: "1",
    name: "name",
    createdAt: {
        nanoseconds: 1,
        seconds: 1,
    } as any,
};

function mountComponent(
    overrides?: Partial<PropsType>,
): VueWrapper<typeof PlannedReservationForm, any> {
    return mount(PlannedReservationForm, {
        props: createProps(overrides),
        global: {
            plugins: [Quasar, i18n],
            components: {
                QInput,
                QSelect,
                QIcon,
                QBtn,
                QTime,
                QPopupProxy,
                QCheckbox,
                QRadio,
            },
            directives: {
                ClosePopup,
            },
        },
    });
}

describe("PlannedReservationForm", () => {
    it("has correct data in 'create' mode", async () => {
        const wrapper = mountComponent();

        wrapper.vm.state.guestName = "John Doe";
        wrapper.vm.state.numberOfGuests = 2;
        wrapper.vm.state.guestContact = "1234567890";
        wrapper.vm.state.reservationNote = "";
        wrapper.vm.state.consumption = 1;
        wrapper.vm.state.arrived = false;
        wrapper.vm.state.time = "12:00";
        wrapper.vm.state.reservedBy = { name: "Staff", email: "staff@example.com" };
        await wrapper.vm.$nextTick();

        await flushPromises();

        expect(wrapper.vm.state).toEqual({
            guestName: "John Doe",
            numberOfGuests: 2,
            guestContact: "1234567890",
            reservationNote: "",
            consumption: 1,
            arrived: false,
            reservationConfirmed: false,
            time: "12:00",
            reservedBy: { name: "Staff", email: "staff@example.com" },
            floorId: "1",
            tableLabel: "1",
            cancelled: false,
            status: ReservationStatus.ACTIVE,
            type: ReservationType.PLANNED,
            isVIP: false,
        });
    });

    it("has correct data in 'update' mode", async () => {
        const wrapper = mountComponent({
            mode: "update",
            reservationData: testReservationData,
        });

        await flushPromises();

        expect(wrapper.vm.state).toEqual({
            guestName: "John Doe",
            numberOfGuests: 2,
            guestContact: "1234567890",
            reservationNote: "",
            creator: MOCK_USER,
            floorId: "1",
            tableLabel: "1",
            reservationConfirmed: false,
            consumption: 1,
            arrived: false,
            time: "12:00",
            reservedBy: { name: "Staff", email: "staff@example.com", id: "1" },
            cancelled: false,
            status: ReservationStatus.ACTIVE,
            type: ReservationType.PLANNED,
            isVIP: false,
        });
    });

    it("validates minimal needed fields to be set", async () => {
        const wrapper = mountComponent();

        // Trigger validation
        await wrapper.vm.reservationForm.validate();
        await flushPromises();

        {
            // Look for error messages in the DOM
            const errorMessages = wrapper.findAll(`.q-field__messages.col div[role="alert"]`);
            expect(errorMessages.length).toBe(1);
            expect(errorMessages[0].text()).toBe("Please type something");
        }

        await wrapper.find(`input[data-test="guest-name"]`).setValue("John Doe");

        // Trigger validation
        await wrapper.vm.reservationForm.validate();
        await flushPromises();

        {
            // Look for error messages in the DOM
            const errorMessages = wrapper.findAll(`.q-field__messages.col div[role="alert"]`);
            expect(errorMessages.length).toBe(1);
            expect(errorMessages[0].text()).toBe("You need to select at least one option");
        }
    });

    it("has correct data when minimal needed fields are set", async () => {
        const wrapper = mountComponent();

        // Set guest name and reservedBy fields
        await wrapper.find(`input[data-test="guest-name"]`).setValue("John Doe");
        // Select 'Social' radio button
        const radioButtons = wrapper.findAll(".q-radio");
        await radioButtons[1].trigger("click");
        await wrapper.vm.$nextTick();

        // Trigger validation
        await wrapper.vm.reservationForm.validate();
        await flushPromises();

        expect(wrapper.vm.state).toEqual({
            guestName: "John Doe",
            arrived: false,
            reservationConfirmed: false,
            consumption: 1,
            guestContact: "",
            numberOfGuests: 2,
            reservationNote: "",
            reservedBy: {
                email: "social-0",
                name: "Whatsapp",
                id: "",
            },
            time: "00:00",
            floorId: "1",
            tableLabel: "1",
            cancelled: false,
            status: ReservationStatus.ACTIVE,
            type: ReservationType.PLANNED,
            isVIP: false,
        });
    });

    it("initializes with correct state in 'edit' mode", () => {
        const wrapper = mountComponent({
            mode: "update",
            reservationData: testReservationData,
        });
        expect(wrapper.vm.state).toEqual(testReservationData);
    });

    it("computes selectableOptions correctly", () => {
        const wrapper = mountComponent({
            users: [{ name: "test user", email: "test@mail.at" } as User],
            mode: "update",
            reservationData: testReservationData,
        });
        expect(wrapper.vm.selectableOptions).toEqual([
            { name: "test user", email: "test@mail.at" },
        ]);
    });

    it("validation returns false if data not set properly", async () => {
        const wrapper = mountComponent({
            users: [{ name: "test user", email: "test@mail.at" } as User],
            mode: "update",
            // bad guestName
            reservationData: { ...testReservationData, guestName: "" },
        });
        const res = await wrapper.vm.reservationForm.validate();
        expect(res).toBeFalsy();
    });
});
