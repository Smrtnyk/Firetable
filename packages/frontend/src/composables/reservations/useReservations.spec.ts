import type { EventDoc, FloorDoc, QueuedReservationDoc, ReservationDoc } from "@firetable/types";
import type { TestingOptions } from "@pinia/testing";
import type { MockInstance } from "vitest";
import type { App } from "vue";

import { FloorEditor, FloorElementTypes, FloorViewer } from "@firetable/floor-creator";
import {
    AdminRole,
    ReservationStatus,
    ReservationType,
    Role,
    UserCapability,
} from "@firetable/types";
import { createTestingPinia } from "@pinia/testing";
import { page, userEvent } from "@vitest/browser/context";
import { flushPromises } from "@vue/test-utils";
import { noop } from "es-toolkit";
import { BottomSheet, Dialog, Loading, Notify, Quasar } from "quasar";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/reservation/EventShowReservation.vue";
import messages from "src/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, nextTick, ref, shallowRef } from "vue";
import { createI18n } from "vue-i18n";
import "quasar/dist/quasar.css";
import "src/css/app.scss";

import { useReservations } from "./useReservations.js";
import { TableOperationType } from "./useTableOperations.js";

const {
    addReservationMock,
    createDialogMock,
    deleteReservationMock,
    eventEmitMock,
    moveReservationFromQueueMock,
    moveReservationToQueueMock,
    updateReservationDocMock,
} = vi.hoisted(() => ({
    addReservationMock: vi.fn().mockResolvedValue(undefined),
    createDialogMock: vi.fn().mockReturnValue({
        hide: vi.fn(),
        onDismiss: vi.fn().mockReturnThis(),
    }),
    deleteReservationMock: vi.fn().mockResolvedValue(undefined),
    eventEmitMock: vi.fn(),
    moveReservationFromQueueMock: vi.fn().mockResolvedValue(undefined),
    moveReservationToQueueMock: vi.fn().mockResolvedValue(undefined),
    notifyPositiveMock: vi.fn(),

    updateReservationDocMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("vue-router", () => {
    return {
        useRouter: vi.fn(),
    };
});

vi.mock("src/boot/event-emitter", () => ({
    eventEmitter: {
        emit: eventEmitMock,
    },
}));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogMock,
    }),
}));

vi.mock("@firetable/backend", () => ({
    addReservation: addReservationMock,
    deleteReservation: deleteReservationMock,
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    getGuestsPath: vi.fn(),
    getUserPath: vi.fn(),
    logoutUser: vi.fn(),
    moveReservationFromQueue: moveReservationFromQueueMock,
    moveReservationToQueue: moveReservationToQueueMock,
    propertiesCollection: vi.fn(),
    subscribeToGuests: vi.fn(),
    updateReservationDoc: updateReservationDocMock,
}));

let app: App<Element>;

describe("useReservations", () => {
    afterEach(async () => {
        app?.unmount();

        // Clean up any remaining dialogs -- not sure what is happening with quasar to leak these dom nodes
        const dialogs = document.querySelectorAll(".q-dialog");
        dialogs.forEach((dialog) => dialog.remove());

        // Clean up any remaining notifications
        const notifications = document.querySelectorAll(".q-notification");
        notifications.forEach((notification) => notification.remove());

        const canvases = document.querySelectorAll("canvas");
        canvases.forEach((canvas) => canvas.remove());

        await flushPromises();
    });

    describe("basic table interactions", () => {
        it("creates reservation when clicking empty table", async () => {
            const { event, floor } = await setupTestEnvironment();

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);

            expect(createDialogMock).toHaveBeenCalledWith({
                component: expect.any(Object),
                componentProps: {
                    component: EventCreateReservation,
                    componentPropsObject: expect.objectContaining({
                        eventDurationInHours: expect.any(Number),
                        eventStartTimestamp: expect.any(Number),
                        mode: "create",
                        timezone: "Europe/Vienna",
                    }),
                    listeners: expect.any(Object),
                    maximized: false,
                    title: expect.stringContaining("T1"),
                },
            });
        });

        it("shows existing reservation when clicking reserved table", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = {
                arrived: false,
                cancelled: false,
                consumption: 0,
                floorId: "1",
                guestName: "John Doe",
                id: "1",
                reservationConfirmed: false,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);

            expect(createDialogMock).toHaveBeenCalledWith({
                component: expect.any(Object),
                componentProps: {
                    component: EventShowReservation,
                    componentPropsObject: expect.objectContaining({
                        reservation: existingReservation,
                        timezone: "Europe/Vienna",
                    }),
                    listeners: expect.any(Object),
                    maximized: false,
                    title: expect.stringContaining("T1"),
                },
            });
        });

        it("prevents interactions when user cannot reserve", async () => {
            const { event, floor } = await setupTestEnvironment();

            const result = withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    auth: {
                        user: {
                            capabilities: {
                                [UserCapability.CAN_RESERVE]: false,
                            },
                            email: "test@mail.com",
                            id: "1",
                            role: Role.STAFF,
                        },
                    },
                },
            );

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);

            expect(createDialogMock).not.toHaveBeenCalled();
        });
    });

    describe("reservation transfers", () => {
        it("transfers reservation between tables on same floor", async () => {
            const { event, floor } = await setupTestEnvironment();
            const sourceReservation = {
                arrived: false,
                cancelled: false,
                consumption: 0,
                floorId: "1",
                guestName: "John Doe",
                id: "1",
                reservationConfirmed: false,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            await result.tableClickHandler(floor, sourceTable);

            result.initiateTableOperation({
                sourceFloor: floor,
                sourceTable,
                type: TableOperationType.RESERVATION_TRANSFER,
            });

            await nextTick();

            const targetTable = floor.getTableByLabel("T2");
            const secondTableClickResult = result.tableClickHandler(floor, targetTable);

            const okBtn = page.getByRole("button", { name: "OK" });
            await expect.element(okBtn).toBeVisible();
            await userEvent.click(okBtn);

            await secondTableClickResult;

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    floorId: floor.id,
                    id: sourceReservation.id,
                    tableLabel: "T2",
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    fromTable: sourceTable,
                    targetReservation: undefined,
                    toTable: targetTable,
                }),
            );
        });

        it("transfers reservation between different floors", async () => {
            const { event } = await setupTestEnvironment();

            const floor1 = await createTestFloor("Floor 1", "1");
            const floor2 = await createTestFloor("Floor 2", "2");

            const sourceReservation = createTestReservation({
                floorId: floor1.id,
                tableLabel: "T1",
            });

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    shallowRef([floor1, floor2]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor1.getTableByLabel("T1")!;
            await result.tableClickHandler(floor1, sourceTable);
            result.initiateTableOperation({
                sourceFloor: floor1,
                sourceTable,
                type: TableOperationType.RESERVATION_TRANSFER,
            });

            await nextTick();

            const targetTable = floor2.getTableByLabel("T2");
            const floor2TableClickResult = result.tableClickHandler(floor2, targetTable);

            const okBtn = page.getByRole("button", { name: "OK" });
            await expect.element(okBtn).toBeVisible();
            await userEvent.click(okBtn);

            await floor2TableClickResult;

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    floorId: floor2.id,
                    id: sourceReservation.id,
                    tableLabel: "T2",
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    fromFloor: "Floor 1",
                    fromTable: sourceTable,
                    toFloor: "Floor 2",
                    toTable: targetTable,
                }),
            );
        });

        it("allows transfer when target table is reserved by swapping reservations", async () => {
            const { event, floor } = await setupTestEnvironment();

            const sourceReservation = createTestReservation({
                id: "1",
                tableLabel: "T1",
            });
            const targetReservation = createTestReservation({
                id: "2",
                tableLabel: "T2",
            });

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation, targetReservation]),
                    shallowRef([floor]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            await result.tableClickHandler(floor, sourceTable);

            result.initiateTableOperation({
                sourceFloor: floor,
                sourceTable,
                type: TableOperationType.RESERVATION_TRANSFER,
            });

            await nextTick();

            const targetTable = floor.getTableByLabel("T2");
            const secondTableClickResult = result.tableClickHandler(floor, targetTable);

            const okBtn = page.getByRole("button", { name: "OK" });
            await expect.element(okBtn).toBeVisible();
            await userEvent.click(okBtn);

            await secondTableClickResult;

            expect(updateReservationDocMock).toHaveBeenCalledTimes(2);

            // First call updates the source reservation to target table
            expect(updateReservationDocMock).toHaveBeenNthCalledWith(
                1,
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    floorId: floor.id,
                    id: sourceReservation.id,
                    tableLabel: "T2",
                }),
            );

            // Second call updates the target reservation to source table
            expect(updateReservationDocMock).toHaveBeenNthCalledWith(
                2,
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    floorId: floor.id,
                    id: targetReservation.id,
                    tableLabel: "T1",
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    fromTable: sourceTable,
                    targetReservation,
                    toTable: targetTable,
                }),
            );
        });

        it("prevents transfer to same table", async () => {
            const { event, floor } = await setupTestEnvironment();
            const sourceReservation = {
                arrived: false,
                cancelled: false,
                consumption: 0,
                floorId: "1",
                id: "1",
                reservationConfirmed: false,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            result.initiateTableOperation({
                sourceFloor: floor,
                sourceTable,
                type: TableOperationType.RESERVATION_TRANSFER,
            });

            await result.tableClickHandler(floor, sourceTable);

            await expect
                .element(page.getByText("Cannot transfer reservation to the same table!"))
                .toBeVisible();
            expect(updateReservationDocMock).not.toHaveBeenCalled();
        });

        it("transfers reservation with linked tables", async () => {
            const { event, floor } = await setupTestEnvironment();
            const sourceReservation = createTestReservation({
                tableLabel: ["T1", "T2"],
            });

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    shallowRef([floor]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            await result.tableClickHandler(floor, sourceTable);

            result.initiateTableOperation({
                sourceFloor: floor,
                sourceTable,
                type: TableOperationType.RESERVATION_TRANSFER,
            });

            await nextTick();

            const targetTable = floor.getTableByLabel("T3");
            const transferResult = result.tableClickHandler(floor, targetTable);
            await userEvent.click(page.getByRole("button", { name: "OK" }));
            await transferResult;

            expect(updateReservationDocMock).toHaveBeenNthCalledWith(
                1,
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    floorId: floor.id,
                    id: sourceReservation.id,
                    tableLabel: "T3",
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    fromTable: sourceTable,
                    toTable: targetTable,
                }),
            );
        });
    });

    describe("reservation management", () => {
        describe("deletion", () => {
            it("handles soft deletion of cancelled reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const existingReservation = {
                    cancelled: true,
                    floorId: "1",
                    guestName: "John Doe",
                    id: "1",
                    status: ReservationStatus.ACTIVE,
                    tableLabel: "T1",
                    time: "19:00",
                    type: ReservationType.PLANNED,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let deleteHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    deleteHandler = config.componentProps.listeners.delete;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickResult = result.tableClickHandler(floor, table);
                await deleteHandler();
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await tableClickResult;
                await nextTick();

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    expect.objectContaining({
                        clearedAt: expect.any(Number),
                        id: existingReservation.id,
                        status: ReservationStatus.DELETED,
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:deleted:soft",
                    expect.objectContaining({
                        event,
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        reservation: existingReservation,
                    }),
                );
            });

            it("handles hard deletion of active reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const existingReservation = {
                    cancelled: false,
                    floorId: "1",
                    guestName: "John Doe",
                    id: "1",
                    status: ReservationStatus.ACTIVE,
                    tableLabel: "T1",
                    time: "19:00",
                    type: ReservationType.PLANNED,
                } as ReservationDoc;
                const futureDate = Date.now() + 24 * 60 * 60 * 1000;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref({
                            ...event,
                            // Set past date to avoid "in progress" condition
                            date: futureDate,
                        }),
                    ),
                );

                let deleteHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    deleteHandler = config.componentProps.listeners.delete;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickResult = result.tableClickHandler(floor, table);
                await deleteHandler();
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await tableClickResult;

                await nextTick();

                expect(deleteReservationMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    existingReservation,
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:deleted",
                    expect.objectContaining({
                        event: expect.any(Object),
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        reservation: existingReservation,
                    }),
                );
            });

            it("cancels deletion when user declines confirmation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const existingReservation = createTestReservation();

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let deleteHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    deleteHandler = config.componentProps.listeners.delete;
                    return { hide: vi.fn(), onDismiss: vi.fn().mockReturnThis() };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickResult = result.tableClickHandler(floor, table);
                await deleteHandler();
                await userEvent.click(page.getByRole("button", { name: "CANCEL" }));
                await tableClickResult;

                expect(deleteReservationMock).not.toHaveBeenCalled();
                expect(updateReservationDocMock).not.toHaveBeenCalled();
            });
        });

        describe("editing", () => {
            it("handles editing existing reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const existingReservation = {
                    floorId: "1",
                    guestName: "John Doe",
                    id: "1",
                    status: ReservationStatus.ACTIVE,
                    tableLabel: "T1",
                    time: "19:00",
                    type: ReservationType.PLANNED,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let editHandler: () => Promise<void> = () => Promise.resolve();
                let updateHandler: (reservation: ReservationDoc) => Promise<void> = () =>
                    Promise.resolve();

                // First dialog (show reservation)
                createDialogMock.mockImplementationOnce((config) => {
                    editHandler = config.componentProps.listeners.edit;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                // Second dialog (edit reservation)
                createDialogMock.mockImplementationOnce((config) => {
                    updateHandler = config.componentProps.listeners.update;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, table);

                await editHandler();

                const updatedReservation = {
                    ...existingReservation,
                    guestName: "Updated Name",
                };
                await updateHandler(updatedReservation);

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    updatedReservation,
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:updated",
                    expect.objectContaining({
                        event,
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        reservation: updatedReservation,
                    }),
                );
            });
        });

        describe("creation", () => {
            it("emits event when creating reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let createHandler: (data: any) => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    createHandler = config.componentProps.listeners.create;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                // Simulate clicking empty table
                const table = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, table);

                const newReservation = {
                    guestName: "New Guest",
                    status: ReservationStatus.ACTIVE,
                    time: "20:00",
                    type: ReservationType.PLANNED,
                };

                await createHandler(newReservation);

                expect(addReservationMock).toHaveBeenCalled();
                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:created",
                    expect.objectContaining({
                        event: expect.any(Object),
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        reservation: expect.objectContaining({
                            ...newReservation,
                            floorId: floor.id,
                            tableLabel: "T1",
                        }),
                    }),
                );
            });

            it("handles API errors during reservation creation", async () => {
                const { event, floor } = await setupTestEnvironment();
                addReservationMock.mockRejectedValueOnce(new Error("API Error"));

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let createHandler: (data: any) => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    createHandler = config.componentProps.listeners.create;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickHandlerResult = result.tableClickHandler(floor, table);

                const newReservation = {
                    guestName: "New Guest",
                    status: ReservationStatus.ACTIVE,
                    time: "20:00",
                    type: ReservationType.PLANNED,
                };

                await createHandler(newReservation);
                await tableClickHandlerResult;
                await nextTick();

                await expect.element(page.getByText("API Error")).toBeVisible();
                expect(eventEmitMock).not.toHaveBeenCalled();
            });
        });

        describe("copy", () => {
            it("handles reservation copy", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = {
                    floorId: "1",
                    guestName: "John Doe",
                    id: "1",
                    status: ReservationStatus.ACTIVE,
                    tableLabel: "T1",
                    time: "19:00",
                    type: ReservationType.PLANNED,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                const sourceTable = floor.getTableByLabel("T1")!;
                result.initiateTableOperation({
                    sourceFloor: floor,
                    sourceTable,
                    type: TableOperationType.RESERVATION_COPY,
                });

                const targetTable = floor.getTableByLabel("T2");
                const table2ClickResult = result.tableClickHandler(floor, targetTable);
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await table2ClickResult;

                expect(addReservationMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    expect.objectContaining({
                        floorId: floor.id,
                        tableLabel: "T2",
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:copied",
                    expect.objectContaining({
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        sourceReservation,
                        targetTable,
                    }),
                );
            });
        });

        describe("linking/unlinking", () => {
            it("handles linking tables to reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: "T1",
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const sourceTable = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, sourceTable);
                await linkHandler();

                const targetTable = floor.getTableByLabel("T2");
                const targetTableClickResult = result.tableClickHandler(floor, targetTable);
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await targetTableClickResult;

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    expect.objectContaining({
                        id: sourceReservation.id,
                        tableLabel: ["T1", "T2"],
                    }),
                );
            });

            it("prevents linking to already reserved table", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: "T1",
                });
                const targetReservation = createTestReservation({
                    id: "2",
                    tableLabel: "T2",
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation, targetReservation]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const sourceTable = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, sourceTable);
                await linkHandler();

                const targetTable = floor.getTableByLabel("T2");
                await result.tableClickHandler(floor, targetTable);

                await expect
                    .element(
                        page.getByText("Cannot link to a table that already has a reservation"),
                    )
                    .toBeVisible();
                expect(updateReservationDocMock).not.toHaveBeenCalled();
            });

            it("prevents linking to already linked table", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const sourceTable = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, sourceTable);
                await linkHandler();

                const targetTable = floor.getTableByLabel("T2");
                await result.tableClickHandler(floor, targetTable);

                await expect
                    .element(
                        page.getByText("Cannot link to a table that already has a reservation"),
                    )
                    .toBeVisible();
                expect(updateReservationDocMock).not.toHaveBeenCalled();
            });

            it("handles unlinking table from reservation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let unlinkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    unlinkHandler = config.componentProps.listeners.unlink;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T2");
                await result.tableClickHandler(floor, table);
                await unlinkHandler();

                // Confirm unlink
                await userEvent.click(page.getByRole("button", { name: "OK" }));

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", organisationId: "1", propertyId: "1" },
                    expect.objectContaining({
                        id: sourceReservation.id,
                        tableLabel: ["T1"],
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:unlinked",
                    expect.objectContaining({
                        event,
                        eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                        sourceReservation,
                        unlinkedTableLabels: ["T2"],
                    }),
                );
            });

            it("cancels unlinking when user declines confirmation", async () => {
                const { event, floor } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let unlinkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    unlinkHandler = config.componentProps.listeners.unlink;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                const table = floor.getTableByLabel("T2");
                await result.tableClickHandler(floor, table);
                await unlinkHandler();

                // Cancel unlink
                await userEvent.click(page.getByRole("button", { name: "CANCEL" }));

                expect(updateReservationDocMock).not.toHaveBeenCalled();
                expect(eventEmitMock).not.toHaveBeenCalled();
            });

            it("prevents linking tables across different floors", async () => {
                const { event } = await setupTestEnvironment();

                const floor1 = await createTestFloor("Floor 1", "1");
                const floor2 = await createTestFloor("Floor 2", "2");

                const sourceReservation = createTestReservation({
                    floorId: floor1.id,
                    tableLabel: "T1",
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        shallowRef([floor1, floor2]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        hide: vi.fn(),
                        onDismiss: vi.fn().mockReturnThis(),
                    };
                });

                // Show reservation dialog for table on floor1 and click link
                const sourceTable = floor1.getTableByLabel("T1");
                await result.tableClickHandler(floor1, sourceTable);
                await linkHandler();

                // Try to link to table on floor2
                const targetTable = floor2.getTableByLabel("T2");
                await result.tableClickHandler(floor2, targetTable);

                await expect
                    .element(page.getByText("Cannot link tables across different floors!"))
                    .toBeVisible();
                expect(updateReservationDocMock).not.toHaveBeenCalled();
            });
        });
    });

    describe("status updates", () => {
        it("marks guest as arrived", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = {
                arrived: false,
                floorId: "1",
                guestName: "John Doe",
                id: "1",
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            let arrivedHandler: (arrived: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                arrivedHandler = config.componentProps.listeners.arrived;
                return {
                    hide: vi.fn(),
                    onDismiss: vi.fn().mockReturnThis(),
                };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);

            await arrivedHandler(true);

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    arrived: true,
                    id: existingReservation.id,
                    waitingForResponse: false,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:arrived",
                expect.objectContaining({
                    event: expect.any(Object),
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    reservation: expect.objectContaining({
                        ...existingReservation,
                        arrived: true,
                    }),
                }),
            );
        });

        it("cancels reservation", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = {
                arrived: false,
                cancelled: false,
                floorId: "1",
                guestName: "John Doe",
                id: "1",
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            let cancelHandler: (cancelled: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                cancelHandler = config.componentProps.listeners.cancel;
                return {
                    hide: vi.fn(),
                    onDismiss: vi.fn().mockReturnThis(),
                };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);
            await cancelHandler(true);

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", organisationId: "1", propertyId: "1" },
                expect.objectContaining({
                    cancelled: true,
                    id: existingReservation.id,
                    waitingForResponse: false,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:cancelled",
                expect.objectContaining({
                    event,
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    reservation: expect.objectContaining({
                        ...existingReservation,
                        cancelled: true,
                    }),
                }),
            );
        });

        it("handles API errors during status updates", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = createTestReservation();

            updateReservationDocMock.mockRejectedValueOnce(new Error("API Error"));

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            let arrivedHandler: (arrived: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                arrivedHandler = config.componentProps.listeners.arrived;
                return { hide: vi.fn(), onDismiss: vi.fn().mockReturnThis() };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);
            await arrivedHandler(true);

            await nextTick();

            await expect.element(page.getByText("API Error")).toBeVisible();
            expect(eventEmitMock).not.toHaveBeenCalled();
        });
    });

    describe("queue operations", () => {
        it("moves reservation to queue", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = {
                floorId: "1",
                guestName: "John Doe",
                id: "1",
                status: ReservationStatus.ACTIVE,
                tableLabel: "T1",
                time: "19:00",
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            let queueHandler: () => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                queueHandler = config.componentProps.listeners.queue;
                return {
                    hide: vi.fn(),
                    onDismiss: vi.fn().mockReturnThis(),
                };
            });

            const table = floor.getTableByLabel("T1");
            const tableClickResult = result.tableClickHandler(floor, table);
            await queueHandler();
            await userEvent.click(page.getByRole("button", { name: "OK" }));
            await tableClickResult;

            expect(moveReservationToQueueMock).toHaveBeenCalled();
        });

        it("handles dequeue operation", async () => {
            const { event, floor } = await setupTestEnvironment();
            const queuedReservation = createTestReservation({
                floorId: undefined,
                id: "1",
                status: ReservationStatus.ACTIVE,
                tableLabel: undefined,
                type: ReservationType.QUEUED,
            }) as unknown as QueuedReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([]),
                    shallowRef([floor]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            result.initiateTableOperation({
                reservation: queuedReservation,
                type: TableOperationType.RESERVATION_DEQUEUE,
            });

            const targetTable = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, targetTable);

            expect(moveReservationFromQueueMock).toHaveBeenCalledWith(
                { id: "1", organisationId: "1", propertyId: "1" },
                queuedReservation.id,
                expect.objectContaining({
                    floorId: floor.id,
                    tableLabel: "T1",
                }),
            );
        });
    });

    it("cancels operation when cancel button is clicked", async () => {
        const { event, floor } = await setupTestEnvironment();
        const sourceReservation = {
            floorId: "1",
            id: "1",
            status: ReservationStatus.ACTIVE,
            tableLabel: "T1",
            time: "19:00",
            type: ReservationType.PLANNED,
        } as ReservationDoc;

        const result = withSetup(() =>
            useReservations(
                ref([]),
                ref([sourceReservation]),
                shallowRef([floor]),
                { id: "1", organisationId: "1", propertyId: "1" },
                ref(event),
            ),
        );

        const sourceTable = floor.getTableByLabel("T1")!;
        result.initiateTableOperation({
            sourceFloor: floor,
            sourceTable,
            type: TableOperationType.RESERVATION_TRANSFER,
        });
        await nextTick();
        await flushPromises();
        // Cancel in notification
        await userEvent.click(page.getByRole("button", { name: "CANCEL" }), {
            force: true,
            timeout: 2000,
        });
        await nextTick();
        // Ok in confirm dialog
        await userEvent.click(page.getByRole("button", { name: "OK" }));
        await nextTick();

        expect(result.ongoingTableOperation.value).toBeUndefined();
    });

    describe("guest data handling", () => {
        it("triggers guest data update when guest contact is added during reservation update", async () => {
            const { event, floor } = await setupTestEnvironment();
            const existingReservation = createTestReservation({
                guestContact: undefined,
                guestName: undefined,
                id: "1",
            });

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    shallowRef([floor]),
                    { id: "1", organisationId: "1", propertyId: "1" },
                    ref(event),
                ),
            );

            let editHandler: () => Promise<void> = () => Promise.resolve();
            let updateHandler: (reservation: ReservationDoc) => Promise<void> = () =>
                Promise.resolve();

            // First dialog (show reservation)
            createDialogMock.mockImplementationOnce((config) => {
                editHandler = config.componentProps.listeners.edit;
                return {
                    hide: vi.fn(),
                    onDismiss: vi.fn().mockReturnThis(),
                };
            });

            // Second dialog (edit reservation)
            createDialogMock.mockImplementationOnce((config) => {
                updateHandler = config.componentProps.listeners.update;
                return {
                    hide: vi.fn(),
                    onDismiss: vi.fn().mockReturnThis(),
                };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);
            await editHandler();

            const updatedReservation = {
                ...existingReservation,
                guestContact: "+1234567890",
                guestName: "John Doe",
            };
            await updateHandler(updatedReservation);

            expect(eventEmitMock).toHaveBeenCalledTimes(1);
            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:updated",
                expect.objectContaining({
                    event,
                    eventOwner: { id: "1", organisationId: "1", propertyId: "1" },
                    oldReservation: existingReservation,
                    reservation: updatedReservation,
                }),
            );
        });
    });

    describe("expired reservations", () => {
        let clearIntervalSpy: MockInstance;
        let setIntervalSpy: MockInstance;
        const reservation = {
            cancelled: true,
            floorId: "1",
            guestName: "John Doe",
            id: "1",
            status: ReservationStatus.ACTIVE,
            tableLabel: "T1",
            time: "19:00",
            type: ReservationType.PLANNED,
        } as ReservationDoc;

        beforeEach(() => {
            vi.useFakeTimers();
            clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
            setIntervalSpy = vi.spyOn(globalThis, "setInterval");
        });

        afterEach(() => {
            vi.useRealTimers();
            clearIntervalSpy.mockRestore();
            setIntervalSpy.mockRestore();
        });

        it("doesn't set up interval when markGuestAsLateAfterMinutes is 0", async () => {
            const { event, floor } = await setupTestEnvironment();

            withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([{ ...reservation }]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    properties: {
                        organisations: [{ id: "1" }],
                        properties: [
                            {
                                id: "1",
                                name: "Test Property",
                                organisationId: "1",
                                settings: {
                                    markGuestAsLateAfterMinutes: 0,
                                    timezone: "Europe/Vienna",
                                },
                            },
                        ],
                    },
                },
            );

            expect(setIntervalSpy).not.toHaveBeenCalled();
        });

        it("sets up interval only when markGuestAsLateAfterMinutes > 0", async () => {
            const { event, floor } = await setupTestEnvironment();

            withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([{ ...reservation }]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    properties: {
                        organisations: [{ id: "1" }],
                        properties: [
                            {
                                id: "1",
                                name: "Test Property",
                                organisationId: "1",
                                settings: {
                                    markGuestAsLateAfterMinutes: 15,
                                    timezone: "Europe/Vienna",
                                },
                            },
                        ],
                    },
                },
            );

            expect(setIntervalSpy).toHaveBeenCalled();
        });

        it("cleans up interval on unmount", async () => {
            const { event, floor } = await setupTestEnvironment();

            withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([{ ...reservation }]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    properties: {
                        organisations: [{ id: "1" }],
                        properties: [
                            {
                                id: "1",
                                name: "Test Property",
                                organisationId: "1",
                                settings: {
                                    markGuestAsLateAfterMinutes: 15,
                                    timezone: "Europe/Vienna",
                                },
                            },
                        ],
                    },
                },
            );

            app.unmount();
            await nextTick();

            expect(clearIntervalSpy).toHaveBeenCalled();
        });

        it("handles missing property settings gracefully", async () => {
            const { event } = await setupTestEnvironment();

            withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    properties: {
                        organisations: [{ id: "1" }],
                        properties: [
                            {
                                id: "1",
                                settings: undefined,
                            },
                        ],
                    },
                },
            );

            // Should use default setting (30 minutes) and set up interval
            expect(setIntervalSpy).toHaveBeenCalled();
        });

        it("marks tables as expired when interval triggers", async () => {
            const baseTime = new Date("2024-01-01T19:00:00");
            vi.setSystemTime(baseTime);

            const { floor } = await setupTestEnvironment();

            // Create event starting at our base time
            const event = {
                _doc: {} as any,
                creator: "test@mail.com",
                date: baseTime.getTime(),
                entryPrice: 0,
                guestListLimit: 100,
                id: "1",
                name: "Test Event",
                organisationId: "1",
                propertyId: "1",
            };

            const reservationWithTime = createTestReservation({
                arrived: false,
                time: "19:00",
            });

            withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([reservationWithTime]),
                        shallowRef([floor]),
                        { id: "1", organisationId: "1", propertyId: "1" },
                        ref(event),
                    ),
                {
                    properties: {
                        organisations: [{ id: "1" }],
                        properties: [
                            {
                                id: "1",
                                settings: {
                                    markGuestAsLateAfterMinutes: 1,
                                    timezone: "Europe/Vienna",
                                },
                            },
                        ],
                    },
                },
            );

            await nextTick();

            // Advance time by 2 minutes (beyond the 1 minute late threshold)
            vi.advanceTimersByTime(120_000);

            const table = floor.getTableByLabel("T1");
            expect(table?.getBaseFill()).toBe("red");
        });
    });
});

async function createTestFloor(name = "Test floor", id = "1"): Promise<FloorViewer> {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 600;
    document.body.appendChild(canvas);

    const editor = new FloorEditor({
        canvas: document.createElement("canvas"),
        containerHeight: 500,
        containerWidth: 500,
        floorDoc: {
            height: 500,
            id,
            json: "",
            name,
            width: 500,
        },
    });

    editor.addElement({
        label: "T1",
        tag: FloorElementTypes.RECT_TABLE,
        x: 100,
        y: 100,
    });

    editor.addElement({
        label: "T2",
        tag: FloorElementTypes.RECT_TABLE,
        x: 200,
        y: 200,
    });

    editor.addElement({
        label: "T3",
        tag: FloorElementTypes.RECT_TABLE,
        x: 300,
        y: 300,
    });

    const { json } = editor.export();
    const floorDoc: FloorDoc = {
        height: 600,
        id,
        json,
        name,
        propertyId: "1",
        width: 400,
    };

    const floorViewer = new FloorViewer({
        canvas,
        containerHeight: 600,
        containerWidth: 400,
        floorDoc,
    });

    await new Promise<void>((resolve) => {
        floorViewer.on("rendered", () => resolve());
    });

    return floorViewer;
}

function createTestReservation(overrides = {}): ReservationDoc {
    return {
        arrived: false,
        cancelled: false,
        consumption: 0,
        floorId: "1",
        guestName: "John Doe",
        id: "1",
        reservationConfirmed: false,
        reservedBy: {
            id: "1",
            name: "Test User",
        },
        status: ReservationStatus.ACTIVE,
        tableLabel: "T1",
        time: "19:00",
        type: ReservationType.PLANNED,
        ...overrides,
    } as ReservationDoc;
}

async function setupTestEnvironment(): Promise<{ event: EventDoc; floor: FloorViewer }> {
    const floor = await createTestFloor();
    const event: EventDoc = {
        _doc: {} as any,
        creator: "test@mail.com",
        date: new Date().getTime(),
        entryPrice: 0,
        guestListLimit: 100,
        id: "1",
        name: "Test Event",
        organisationId: "1",
        propertyId: "1",
    };

    return {
        event,
        floor,
    };
}

function withSetup(
    composable: () => ReturnType<typeof useReservations>,
    initialState: Partial<TestingOptions["initialState"]> = {},
): ReturnType<typeof useReservations> {
    let result: ReturnType<typeof useReservations>;
    const defaultInitialState = {
        auth: {
            user: {
                email: "test@mail.com",
                id: "1",
                role: AdminRole.ADMIN,
            },
        },
        properties: {
            organisations: [
                {
                    id: "1",
                },
            ],
            properties: [
                {
                    id: "1",
                    name: "Test Property",
                    organisationId: "1",
                    settings: {
                        timezone: "Europe/Vienna",
                    },
                },
            ],
        },
    };
    const testingPinia = createTestingPinia({
        createSpy: vi.fn,
        initialState: {
            ...defaultInitialState,
            ...initialState,
        },
        stubActions: false,
    });
    const i18n = createI18n({
        fallbackLocale: "en-GB",
        legacy: false,
        locale: "en-GB",
        messages,
    });
    app = createApp({
        setup() {
            result = composable();
            return noop;
        },
    });
    app.use(Quasar);
    Quasar.install(app, { plugins: { BottomSheet, Dialog, Loading, Notify } });
    app.use(i18n);
    app.use(testingPinia);

    const container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
    app.mount(container);

    return result!;
}
