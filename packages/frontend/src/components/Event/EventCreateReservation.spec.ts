import { config, flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import { Quasar } from "quasar";
import messages from "../../i18n";

import EventCreateReservation from "./EventCreateReservation.vue";
import { Reservation, User } from "@firetable/types";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

config.global.plugins = [i18n];

const testReservationData = {
    guestName: "John Doe",
    numberOfGuests: 2,
    guestContact: "1234567890",
    reservationNote: "",
    consumption: 1,
    confirmed: false,
    time: "12:00",
    reservedBy: { name: "Staff", email: "staff@example.com" },
};

type TestProps = {
    users: User[];
    mode: "create" | "edit";
    reservationData: Reservation | null;
};

function createProps(overrides: Partial<TestProps> = {}): TestProps {
    const defaultProps: TestProps = {
        users: [],
        mode: "create",
        reservationData: null,
    };

    return { ...defaultProps, ...overrides };
}

function mountComponent(overrides?: Partial<TestProps>): VueWrapper<EventCreateReservation, any> {
    return mount(EventCreateReservation, {
        props: createProps(overrides),
        global: {
            plugins: [Quasar],
        },
    });
}

describe("EventCreateReservation", () => {
    it("emits 'create' event with correct payload on OK click in 'create' mode", async () => {
        const wrapper = mountComponent();

        wrapper.vm.state.guestName = "John Doe";
        wrapper.vm.state.numberOfGuests = 2;
        wrapper.vm.state.guestContact = "1234567890";
        wrapper.vm.state.reservationNote = "";
        wrapper.vm.state.consumption = 1;
        wrapper.vm.state.confirmed = false;
        wrapper.vm.state.time = "12:00";
        wrapper.vm.state.reservedBy = { name: "Staff", email: "staff@example.com" };
        await wrapper.vm.$nextTick();

        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");

        await flushPromises();

        expect(wrapper.emitted().create).toBeTruthy();
        expect(wrapper.emitted().create[0]).toEqual([
            {
                guestName: "John Doe",
                numberOfGuests: 2,
                guestContact: "1234567890",
                reservationNote: "",
                consumption: 1,
                confirmed: false,
                time: "12:00",
                reservedBy: { name: "Staff", email: "staff@example.com" },
            },
        ]);
    });

    it("emits 'update' event with correct payload on OK click in 'edit' mode", async () => {
        const wrapper = mountComponent({
            mode: "edit",
            reservationData: testReservationData,
        });

        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");

        await flushPromises();

        expect(wrapper.emitted().update).toBeTruthy();
        expect(wrapper.emitted().update[0]).toEqual([
            {
                guestName: "John Doe",
                numberOfGuests: 2,
                guestContact: "1234567890",
                reservationNote: "",
                consumption: 1,
                confirmed: false,
                time: "12:00",
                reservedBy: { name: "Staff", email: "staff@example.com" },
            },
        ]);
    });

    it("validates minimal needed fields to be set", async () => {
        const wrapper = mountComponent();

        // Trigger validation by clicking the OK button
        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");
        await flushPromises();

        {
            // Look for error messages in the DOM
            const errorMessages = wrapper.findAll(`.q-field__messages.col div[role="alert"]`);
            expect(errorMessages.length).toBe(1);
            expect(errorMessages[0].text()).toBe("Please type something");
        }

        await wrapper.find(`input[data-test="guest-name"]`).setValue("John Doe");

        // Trigger validation by clicking the OK button
        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");
        await flushPromises();

        {
            // Look for error messages in the DOM
            const errorMessages = wrapper.findAll(`.q-field__messages.col div[role="alert"]`);
            expect(errorMessages.length).toBe(1);
            expect(errorMessages[0].text()).toBe("You need to select at least one option");
        }
    });

    it("emits correct data when minimal needed fields are set", async () => {
        const wrapper = mountComponent();

        // Set guest name and reservedBy fields
        await wrapper.find(`input[data-test="guest-name"]`).setValue("John Doe");
        // Select 'Social' radio button
        const radioButtons = wrapper.findAll(".q-radio");
        await radioButtons[1].trigger("click");
        await wrapper.vm.$nextTick();

        // Trigger validation by clicking the OK button
        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");
        await flushPromises();

        expect(wrapper.emitted().create).toBeTruthy();
        expect(wrapper.emitted().create[0]).toEqual([
            {
                guestName: "John Doe",
                confirmed: false,
                consumption: 1,
                guestContact: "",
                numberOfGuests: 2,
                reservationNote: "",
                reservedBy: {
                    email: "social-0",
                    name: "Whatsapp",
                },
                time: "00:00",
            },
        ]);
    });

    it("initializes with correct state in 'edit' mode", () => {
        const wrapper = mountComponent({
            mode: "edit",
            reservationData: testReservationData,
        });
        expect(wrapper.vm.state).toEqual(testReservationData);
    });

    it("computes selectableOptions correctly", () => {
        const wrapper = mountComponent({
            users: [{ name: "test user", email: "test@mail.at" } as User],
            mode: "edit",
            reservationData: testReservationData,
        });
        expect(wrapper.vm.selectableOptions).toEqual([
            { name: "test user", email: "test@mail.at" },
        ]);
    });

    it("does not emit 'create' event if validation fails", async () => {
        const wrapper = mountComponent({
            users: [{ name: "test user", email: "test@mail.at" } as User],
            mode: "edit",
            reservationData: testReservationData,
        });
        await wrapper.find(`button[data-test="ok-btn"]`).trigger("click");
        await flushPromises();
        expect(wrapper.emitted().create).toBeFalsy();
    });
});