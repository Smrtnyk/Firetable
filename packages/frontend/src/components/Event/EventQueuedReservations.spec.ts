import type { RenderResult } from "vitest-browser-vue";
import type { EventQueuedReservationsProps } from "./EventQueuedReservations.vue";
import type { AnyFunction, EventDoc, QueuedReservationDoc, User } from "@firetable/types";
import EventQueuedReservations from "./EventQueuedReservations.vue";
import { mockedStore, renderComponent, t } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { DEFAULT_ORGANISATION_SETTINGS, usePropertiesStore } from "src/stores/properties-store";
import FTDialog from "src/components/FTDialog.vue";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowQueuedReservation from "src/components/Event/reservation/EventShowQueuedReservation.vue";
import { useEventsStore } from "src/stores/events-store";
import { noop } from "es-toolkit";

const { createDialogSpy } = vi.hoisted(() => {
    return {
        createDialogSpy: vi.fn(),
    };
});

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    Loading: {
        show: vi.fn(),
    },
}));

describe("EventQueuedReservations.vue", () => {
    let props: EventQueuedReservationsProps;
    let authState: Record<string, unknown>;
    let eventsStoreState: Record<string, unknown>;
    let propertiesStoreState: Record<string, unknown>;

    beforeEach(() => {
        authState = {
            user: {
                id: "user1",
                email: "",
            },
        };
        eventsStoreState = {
            showQueuedReservationsDrawer: true,
        };
        propertiesStoreState = {};
        props = {
            data: [],
            error: undefined,
            eventData: {
                date: Date.now(),
            } as unknown as EventDoc,
            eventOwner: {
                id: "event1",
                propertyId: "prop1",
                organisationId: "org1",
            },
            users: [
                { id: "user1", name: "User One" } as unknown as User,
                { id: "user2", name: "User Two" } as unknown as User,
            ],
        };
    });

    function render(): RenderResult<EventQueuedReservationsProps> {
        return renderComponent(EventQueuedReservations, props, {
            wrapInLayout: true,
            piniaStoreOptions: {
                initialState: {
                    auth: authState,
                    events: eventsStoreState,
                    properties: propertiesStoreState,
                },
            },
        });
    }

    it("renders the drawer and title correctly", async () => {
        const screen = render();

        await expect
            .element(screen.getByText(t("EventQueuedReservations.title")))
            .toBeInTheDocument();
        await expect.element(screen.getByLabelText("Add new reservation")).toBeVisible();
    });

    it("shows empty message when there are no reservations", async () => {
        const screen = render();

        await expect
            .element(screen.getByText(t("EventQueuedReservations.emptyMessage")))
            .toBeVisible();
        await expect
            .element(screen.getByAltText("Empty reservations image"))
            .toHaveAttribute("src", "/people-confirmation.svg");
    });

    it("shows error message when there are no reservations and an error exists", async () => {
        props.error = new Error("Failed to fetch reservations");
        const screen = render();

        await expect
            .element(screen.getByText(t("EventQueuedReservations.errorMessage")))
            .toBeVisible();
    });

    it("renders a list of reservations when data is provided", async () => {
        props.data = [
            {
                id: "res1",
                guestName: "John Doe",
                guestContact: "john@example.com",
                isVIP: true,
            } as unknown as QueuedReservationDoc,
            {
                id: "res2",
                guestName: "Jane Smith",
                guestContact: "jane@example.com",
                isVIP: false,
            } as unknown as QueuedReservationDoc,
        ];
        const screen = render();

        const listItems = screen.getByRole("listitem");
        expect(listItems.elements()).toHaveLength(2);

        await expect.element(screen.getByText("VIP")).toBeVisible();
        expect(screen.getByText("VIP").elements()).toHaveLength(1);
    });

    it("opens the add new reservation dialog when plus button is clicked", async () => {
        const screen = render();
        const propertiesStore = mockedStore(usePropertiesStore);
        propertiesStore.getOrganisationSettingsById.mockReturnValue(DEFAULT_ORGANISATION_SETTINGS);

        const addButton = screen.getByLabelText("Add new reservation");
        await userEvent.click(addButton);

        expect(createDialogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                component: FTDialog,
                componentProps: expect.objectContaining({
                    component: EventCreateReservation,
                    title: t("EventQueuedReservations.addNewReservation"),
                    maximized: false,
                    componentPropsObject: expect.objectContaining({
                        mode: "create",
                        onlyPlanned: true,
                    }),
                }),
            }),
        );
    });

    it("shows reservation details dialog when a reservation is clicked", async () => {
        props.data = [
            {
                id: "res1",
                guestName: "John Doe",
                guestContact: "john@example.com",
                isVIP: true,
            } as unknown as QueuedReservationDoc,
        ];
        const screen = render();

        const reservationItem = screen.getByText("John Doe");
        await userEvent.click(reservationItem);

        expect(createDialogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                component: FTDialog,
                componentProps: expect.objectContaining({
                    component: EventShowQueuedReservation,
                    title: "",
                }),
            }),
        );
    });

    it("closes dialog and drawer on 'unqueue'", async () => {
        props.data = [
            {
                id: "res1",
                guestName: "John Doe",
                guestContact: "john@example.com",
                isVIP: true,
            } as unknown as QueuedReservationDoc,
        ];
        const mockHide = vi.fn();
        const dialog = {
            hide: mockHide,
        };
        let unqueue: AnyFunction = noop;
        createDialogSpy.mockImplementation(({ componentProps }) => {
            unqueue = componentProps.listeners.unqueue;
            return dialog;
        });

        const screen = render();
        const eventsStore = mockedStore(useEventsStore);
        const reservationItem = screen.getByText("John Doe");

        await userEvent.click(reservationItem);

        unqueue();

        expect(eventsStore.showQueuedReservationsDrawer).toBe(false);
        expect(mockHide).toHaveBeenCalled();
    });

    it("does not render the drawer when showQueuedReservationsDrawer is false", () => {
        eventsStoreState.showQueuedReservationsDrawer = false;

        render();

        const drawer = document.querySelector(".q-drawer__backdrop");
        expect(drawer).not.toBeVisible();
    });

    it("renders the correct number of reservations", () => {
        props.data = [
            {
                id: "res1",
                guestName: "Guest 1",
                guestContact: "g1@example.com",
                isVIP: false,
            } as QueuedReservationDoc,
            {
                id: "res2",
                guestName: "Guest 2",
                guestContact: "g2@example.com",
                isVIP: true,
            } as QueuedReservationDoc,
            {
                id: "res3",
                guestName: "Guest 3",
                guestContact: "g3@example.com",
                isVIP: false,
            } as QueuedReservationDoc,
        ];
        const screen = render();

        const reservationItems = screen.getByRole("listitem");
        expect(reservationItems.elements()).toHaveLength(3);
    });
});
