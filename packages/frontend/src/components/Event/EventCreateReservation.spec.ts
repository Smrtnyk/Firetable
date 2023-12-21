import type { VueWrapper } from "@vue/test-utils";
import type { Reservation, ReservationDoc, User } from "@firetable/types";
import EventCreateReservation from "./EventCreateReservation.vue";
import messages from "../../i18n";
import * as authStore from "../../stores/auth-store";
import * as Backend from "@firetable/backend";
import { config, flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { Quasar } from "quasar";
import { ReservationStatus } from "@firetable/types";

const i18n = createI18n({
    locale: "en-GB",
    fallbackLocale: "en-GB",
    messages,
    legacy: false,
});

config.global.plugins = [i18n];

const testReservationData: Reservation = {
    guestName: "John Doe",
    numberOfGuests: 2,
    guestContact: "1234567890",
    reservationNote: "",
    consumption: 1,
    confirmed: false,
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
};

type TestProps = {
    users: User[];
    mode: "create" | "edit";
    table: { label: string };
    floor: { id: string };
    reservationData: Reservation | null;
    eventStartTimestamp: number;
};

function createProps(overrides: Partial<TestProps> = {}): TestProps {
    const defaultProps: TestProps = {
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

function mountComponent(overrides?: Partial<TestProps>): VueWrapper<EventCreateReservation, any> {
    return mount(EventCreateReservation, {
        props: createProps(overrides),
        global: {
            plugins: [Quasar],
        },
    });
}

describe("EventCreateReservation", () => {
    beforeEach(() => {
        vi.spyOn(Backend, "getFirestoreTimestamp").mockReturnValue({
            seconds: 1,
            nanoseconds: 1,
        } as any);
        vi.spyOn(authStore, "useAuthStore").mockReturnValue({
            user: MOCK_USER,
        } as any);
    });

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
                reservationConfirmed: false,
                time: "12:00",
                reservedBy: { name: "Staff", email: "staff@example.com" },
                creator: MOCK_USER,
                floorId: "1",
                tableLabel: "1",
                cancelled: false,
                status: ReservationStatus.ACTIVE,
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
                creator: MOCK_USER,
                floorId: "1",
                tableLabel: "1",
                reservationConfirmed: false,
                consumption: 1,
                confirmed: false,
                time: "12:00",
                reservedBy: { name: "Staff", email: "staff@example.com", id: "1" },
                cancelled: false,
                status: ReservationStatus.ACTIVE,
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
                creator: MOCK_USER,
                floorId: "1",
                tableLabel: "1",
                cancelled: false,
                status: ReservationStatus.ACTIVE,
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
