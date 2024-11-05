import type { FloorDoc, ReservationDoc, EventDoc, QueuedReservationDoc } from "@firetable/types";
import type { App } from "vue";
import type { TestingOptions } from "@pinia/testing";
import { TableOperationType, useReservations } from "../composables/useReservations";
import { Role, UserCapability, ADMIN, ReservationStatus, ReservationType } from "@firetable/types";
import { shallowRef, nextTick, createApp, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloorEditor, FloorElementTypes, FloorViewer } from "@firetable/floor-creator";
import EventCreateReservation from "src/components/Event/reservation/EventCreateReservation.vue";
import EventShowReservation from "src/components/Event/reservation/EventShowReservation.vue";
import messages from "src/i18n";
import { BottomSheet, Dialog, Loading, Notify, Quasar } from "quasar";
import { noop } from "es-toolkit";
import { createI18n } from "vue-i18n";
import { createTestingPinia } from "@pinia/testing";

import "quasar/dist/quasar.css";
import "src/css/app.scss";
import { page, userEvent } from "@vitest/browser/context";
import { flushPromises } from "@vue/test-utils";

const {
    createDialogMock,
    updateReservationDocMock,
    addReservationMock,
    deleteReservationMock,
    moveReservationFromQueueMock,
    moveReservationToQueueMock,
    eventEmitMock,
} = vi.hoisted(() => ({
    createDialogMock: vi.fn().mockReturnValue({
        onDismiss: vi.fn().mockReturnThis(),
        hide: vi.fn(),
    }),
    updateReservationDocMock: vi.fn().mockResolvedValue(undefined),
    addReservationMock: vi.fn().mockResolvedValue(undefined),
    deleteReservationMock: vi.fn().mockResolvedValue(undefined),
    moveReservationFromQueueMock: vi.fn().mockResolvedValue(undefined),
    moveReservationToQueueMock: vi.fn().mockResolvedValue(undefined),
    notifyPositiveMock: vi.fn(),

    eventEmitMock: vi.fn(),
}));

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

vi.mock("../backend-proxy", () => ({
    updateReservationDoc: updateReservationDocMock,
    addReservation: addReservationMock,
    deleteReservation: deleteReservationMock,
    moveReservationFromQueue: moveReservationFromQueueMock,
    moveReservationToQueue: moveReservationToQueueMock,
    getGuestsPath: vi.fn(),
    getUserPath: vi.fn(),
    subscribeToGuests: vi.fn(),
    logoutUser: vi.fn(),
}));

let app: App<Element>;

describe("useReservations", () => {
    afterEach(async () => {
        app?.unmount();

        // Clean up any remaining dialogs
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
            const { floor, event } = await setupTestEnvironment();

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
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
                        mode: "create",
                        timezone: "Europe/Vienna",
                        eventStartTimestamp: expect.any(Number),
                        eventDurationInHours: expect.any(Number),
                    }),
                    title: expect.stringContaining("T1"),
                    maximized: false,
                    listeners: expect.any(Object),
                },
            });
        });

        it("shows existing reservation when clicking reserved table", async () => {
            const { floor, event } = await setupTestEnvironment();
            const existingReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                guestName: "John Doe",
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
                reservationConfirmed: false,
                cancelled: false,
                arrived: false,
                consumption: 0,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
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
                    title: expect.stringContaining("T1"),
                    maximized: false,
                    listeners: expect.any(Object),
                },
            });
        });

        it("prevents interactions when user cannot reserve", async () => {
            const { floor, event } = await setupTestEnvironment();

            const result = withSetup(
                () =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                {
                    auth: {
                        user: {
                            id: "1",
                            email: "test@mail.com",
                            role: Role.STAFF,
                            capabilities: {
                                [UserCapability.CAN_RESERVE]: false,
                            },
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
            const { floor, event } = await setupTestEnvironment();
            const sourceReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                guestName: "John Doe",
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
                reservationConfirmed: false,
                cancelled: false,
                arrived: false,
                consumption: 0,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            await result.tableClickHandler(floor, sourceTable);

            result.initiateTableOperation({
                type: TableOperationType.RESERVATION_TRANSFER,
                sourceFloor: floor,
                sourceTable,
            });

            await nextTick();

            const targetTable = floor.getTableByLabel("T2");
            const secondTableClickResult = result.tableClickHandler(floor, targetTable);

            const okBtn = page.getByRole("button", { name: "OK" });
            await expect.element(okBtn).toBeVisible();
            await userEvent.click(okBtn);

            await secondTableClickResult;

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: sourceReservation.id,
                    tableLabel: "T2",
                    floorId: floor.id,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    fromTable: sourceTable,
                    toTable: targetTable,
                    eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                    targetReservation: undefined,
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
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor1.getTableByLabel("T1")!;
            await result.tableClickHandler(floor1, sourceTable);
            result.initiateTableOperation({
                type: TableOperationType.RESERVATION_TRANSFER,
                sourceFloor: floor1,
                sourceTable,
            });

            await nextTick();

            const targetTable = floor2.getTableByLabel("T2");
            const floor2TableClickResult = result.tableClickHandler(floor2, targetTable);

            const okBtn = page.getByRole("button", { name: "OK" });
            await expect.element(okBtn).toBeVisible();
            await userEvent.click(okBtn);

            await floor2TableClickResult;

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: sourceReservation.id,
                    tableLabel: "T2",
                    floorId: floor2.id,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    fromTable: sourceTable,
                    toTable: targetTable,
                    fromFloor: "Floor 1",
                    toFloor: "Floor 2",
                    eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                }),
            );
        });

        it("allows transfer when target table is reserved by swapping reservations", async () => {
            const { floor, event } = await setupTestEnvironment();

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
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            await result.tableClickHandler(floor, sourceTable);

            result.initiateTableOperation({
                type: TableOperationType.RESERVATION_TRANSFER,
                sourceFloor: floor,
                sourceTable,
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
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: sourceReservation.id,
                    tableLabel: "T2",
                    floorId: floor.id,
                }),
            );

            // Second call updates the target reservation to source table
            expect(updateReservationDocMock).toHaveBeenNthCalledWith(
                2,
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: targetReservation.id,
                    tableLabel: "T1",
                    floorId: floor.id,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:transferred",
                expect.objectContaining({
                    fromTable: sourceTable,
                    toTable: targetTable,
                    eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                    targetReservation,
                }),
            );
        });

        it("prevents transfer to same table", async () => {
            const { floor, event } = await setupTestEnvironment();
            const sourceReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
                reservationConfirmed: false,
                cancelled: false,
                arrived: false,
                consumption: 0,
                reservedBy: {
                    id: "1",
                    name: "Test User",
                },
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([sourceReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            const sourceTable = floor.getTableByLabel("T1")!;
            result.initiateTableOperation({
                type: TableOperationType.RESERVATION_TRANSFER,
                sourceFloor: floor,
                sourceTable,
            });

            await result.tableClickHandler(floor, sourceTable);

            await expect
                .element(page.getByText("Cannot transfer reservation to the same table!"))
                .toBeVisible();
            expect(updateReservationDocMock).not.toHaveBeenCalled();
        });
    });

    describe("reservation management", () => {
        describe("deletion", () => {
            it("handles soft deletion of cancelled reservation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const existingReservation = {
                    id: "1",
                    floorId: "1",
                    tableLabel: "T1",
                    guestName: "John Doe",
                    time: "19:00",
                    status: ReservationStatus.ACTIVE,
                    type: ReservationType.PLANNED,
                    cancelled: true,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let deleteHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    deleteHandler = config.componentProps.listeners.delete;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickResult = result.tableClickHandler(floor, table);
                await deleteHandler();
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await tableClickResult;
                await nextTick();

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", propertyId: "1", organisationId: "1" },
                    expect.objectContaining({
                        id: existingReservation.id,
                        status: ReservationStatus.DELETED,
                        clearedAt: expect.any(Number),
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:deleted:soft",
                    expect.objectContaining({
                        reservation: existingReservation,
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                        event,
                    }),
                );
            });

            it("handles hard deletion of active reservation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const existingReservation = {
                    id: "1",
                    floorId: "1",
                    tableLabel: "T1",
                    guestName: "John Doe",
                    time: "19:00",
                    status: ReservationStatus.ACTIVE,
                    type: ReservationType.PLANNED,
                    cancelled: false,
                } as ReservationDoc;
                const futureDate = Date.now() + 24 * 60 * 60 * 1000;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
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
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickResult = result.tableClickHandler(floor, table);
                await deleteHandler();
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await tableClickResult;

                await nextTick();

                expect(deleteReservationMock).toHaveBeenCalledWith(
                    { id: "1", propertyId: "1", organisationId: "1" },
                    existingReservation,
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:deleted",
                    expect.objectContaining({
                        reservation: existingReservation,
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                        event: expect.any(Object),
                    }),
                );
            });

            it("cancels deletion when user declines confirmation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const existingReservation = createTestReservation();

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let deleteHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    deleteHandler = config.componentProps.listeners.delete;
                    return { onDismiss: vi.fn().mockReturnThis(), hide: vi.fn() };
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
                const { floor, event } = await setupTestEnvironment();
                const existingReservation = {
                    id: "1",
                    floorId: "1",
                    tableLabel: "T1",
                    guestName: "John Doe",
                    time: "19:00",
                    status: ReservationStatus.ACTIVE,
                    type: ReservationType.PLANNED,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([existingReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
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
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                // Second dialog (edit reservation)
                createDialogMock.mockImplementationOnce((config) => {
                    updateHandler = config.componentProps.listeners.update;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
                    { id: "1", propertyId: "1", organisationId: "1" },
                    updatedReservation,
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:updated",
                    expect.objectContaining({
                        reservation: updatedReservation,
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                        event,
                    }),
                );
            });
        });

        describe("creation", () => {
            it("emits event when creating reservation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let createHandler: (data: any) => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    createHandler = config.componentProps.listeners.create;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                // Simulate clicking empty table
                const table = floor.getTableByLabel("T1");
                await result.tableClickHandler(floor, table);

                const newReservation = {
                    guestName: "New Guest",
                    time: "20:00",
                    status: ReservationStatus.ACTIVE,
                    type: ReservationType.PLANNED,
                };

                await createHandler(newReservation);

                expect(addReservationMock).toHaveBeenCalled();
                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:created",
                    expect.objectContaining({
                        reservation: expect.objectContaining({
                            ...newReservation,
                            floorId: floor.id,
                            tableLabel: "T1",
                        }),
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                        event: expect.any(Object),
                    }),
                );
            });

            it("handles API errors during reservation creation", async () => {
                const { floor, event } = await setupTestEnvironment();
                addReservationMock.mockRejectedValueOnce(new Error("API Error"));

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let createHandler: (data: any) => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    createHandler = config.componentProps.listeners.create;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                const table = floor.getTableByLabel("T1");
                const tableClickHandlerResult = result.tableClickHandler(floor, table);

                const newReservation = {
                    guestName: "New Guest",
                    time: "20:00",
                    status: ReservationStatus.ACTIVE,
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
                const { floor, event } = await setupTestEnvironment();
                const sourceReservation = {
                    id: "1",
                    floorId: "1",
                    tableLabel: "T1",
                    guestName: "John Doe",
                    time: "19:00",
                    status: ReservationStatus.ACTIVE,
                    type: ReservationType.PLANNED,
                } as ReservationDoc;

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                const sourceTable = floor.getTableByLabel("T1")!;
                result.initiateTableOperation({
                    type: TableOperationType.RESERVATION_COPY,
                    sourceFloor: floor,
                    sourceTable,
                });

                const targetTable = floor.getTableByLabel("T2");
                const table2ClickResult = result.tableClickHandler(floor, targetTable);
                await userEvent.click(page.getByRole("button", { name: "OK" }));
                await table2ClickResult;

                expect(addReservationMock).toHaveBeenCalledWith(
                    { id: "1", propertyId: "1", organisationId: "1" },
                    expect.objectContaining({
                        tableLabel: "T2",
                        floorId: floor.id,
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:copied",
                    expect.objectContaining({
                        sourceReservation,
                        targetTable,
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                    }),
                );
            });
        });

        describe("linking/unlinking", () => {
            it("handles linking tables to reservation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: "T1",
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        shallowRef([floor]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
                    { id: "1", propertyId: "1", organisationId: "1" },
                    expect.objectContaining({
                        id: sourceReservation.id,
                        tableLabel: ["T1", "T2"],
                    }),
                );
            });

            it("prevents linking to already reserved table", async () => {
                const { floor, event } = await setupTestEnvironment();
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
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
                const { floor, event } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
                const { floor, event } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let unlinkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    unlinkHandler = config.componentProps.listeners.unlink;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
                    };
                });

                const table = floor.getTableByLabel("T2");
                await result.tableClickHandler(floor, table);
                await unlinkHandler();

                // Confirm unlink
                await userEvent.click(page.getByRole("button", { name: "OK" }));

                expect(updateReservationDocMock).toHaveBeenCalledWith(
                    { id: "1", propertyId: "1", organisationId: "1" },
                    expect.objectContaining({
                        id: sourceReservation.id,
                        tableLabel: ["T1"],
                    }),
                );

                expect(eventEmitMock).toHaveBeenCalledWith(
                    "reservation:unlinked",
                    expect.objectContaining({
                        eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                        event,
                        sourceReservation,
                        unlinkedTableLabels: ["T2"],
                    }),
                );
            });

            it("cancels unlinking when user declines confirmation", async () => {
                const { floor, event } = await setupTestEnvironment();
                const sourceReservation = createTestReservation({
                    tableLabel: ["T1", "T2"],
                });

                const result = withSetup(() =>
                    useReservations(
                        ref([]),
                        ref([sourceReservation]),
                        ref([]),
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let unlinkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    unlinkHandler = config.componentProps.listeners.unlink;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
                        { id: "1", propertyId: "1", organisationId: "1" },
                        ref(event),
                    ),
                );

                let linkHandler: () => Promise<void> = () => Promise.resolve();
                createDialogMock.mockImplementationOnce((config) => {
                    linkHandler = config.componentProps.listeners.link;
                    return {
                        onDismiss: vi.fn().mockReturnThis(),
                        hide: vi.fn(),
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
            const { floor, event } = await setupTestEnvironment();
            const existingReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                guestName: "John Doe",
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
                arrived: false,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            let arrivedHandler: (arrived: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                arrivedHandler = config.componentProps.listeners.arrived;
                return {
                    onDismiss: vi.fn().mockReturnThis(),
                    hide: vi.fn(),
                };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);

            await arrivedHandler(true);

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: existingReservation.id,
                    arrived: true,
                    waitingForResponse: false,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:arrived",
                expect.objectContaining({
                    reservation: expect.objectContaining({
                        ...existingReservation,
                        arrived: true,
                    }),
                    eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                    event: expect.any(Object),
                }),
            );
        });

        it("cancels reservation", async () => {
            const { floor, event } = await setupTestEnvironment();
            const existingReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                guestName: "John Doe",
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
                cancelled: false,
                arrived: false,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            let cancelHandler: (cancelled: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                cancelHandler = config.componentProps.listeners.cancel;
                return {
                    onDismiss: vi.fn().mockReturnThis(),
                    hide: vi.fn(),
                };
            });

            const table = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, table);
            await cancelHandler(true);

            expect(updateReservationDocMock).toHaveBeenCalledWith(
                { id: "1", propertyId: "1", organisationId: "1" },
                expect.objectContaining({
                    id: existingReservation.id,
                    cancelled: true,
                    waitingForResponse: false,
                }),
            );

            expect(eventEmitMock).toHaveBeenCalledWith(
                "reservation:cancelled",
                expect.objectContaining({
                    reservation: expect.objectContaining({
                        ...existingReservation,
                        cancelled: true,
                    }),
                    eventOwner: { id: "1", propertyId: "1", organisationId: "1" },
                    event,
                }),
            );
        });

        it("handles API errors during status updates", async () => {
            const { floor, event } = await setupTestEnvironment();
            const existingReservation = createTestReservation();

            updateReservationDocMock.mockRejectedValueOnce(new Error("API Error"));

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            let arrivedHandler: (arrived: boolean) => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                arrivedHandler = config.componentProps.listeners.arrived;
                return { onDismiss: vi.fn().mockReturnThis(), hide: vi.fn() };
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
            const { floor, event } = await setupTestEnvironment();
            const existingReservation = {
                id: "1",
                floorId: "1",
                tableLabel: "T1",
                guestName: "John Doe",
                time: "19:00",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.PLANNED,
            } as ReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([existingReservation]),
                    ref([]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            let queueHandler: () => Promise<void> = () => Promise.resolve();
            createDialogMock.mockImplementationOnce((config) => {
                queueHandler = config.componentProps.listeners.queue;
                return {
                    onDismiss: vi.fn().mockReturnThis(),
                    hide: vi.fn(),
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
            const { floor, event } = await setupTestEnvironment();
            const queuedReservation = createTestReservation({
                id: "1",
                status: ReservationStatus.ACTIVE,
                type: ReservationType.QUEUED,
                floorId: undefined,
                tableLabel: undefined,
            }) as unknown as QueuedReservationDoc;

            const result = withSetup(() =>
                useReservations(
                    ref([]),
                    ref([]),
                    shallowRef([floor]),
                    { id: "1", propertyId: "1", organisationId: "1" },
                    ref(event),
                ),
            );

            result.initiateTableOperation({
                type: TableOperationType.RESERVATION_DEQUEUE,
                reservation: queuedReservation,
            });

            const targetTable = floor.getTableByLabel("T1");
            await result.tableClickHandler(floor, targetTable);

            expect(moveReservationFromQueueMock).toHaveBeenCalledWith(
                { id: "1", propertyId: "1", organisationId: "1" },
                queuedReservation.id,
                expect.objectContaining({
                    floorId: floor.id,
                    tableLabel: "T1",
                }),
            );
        });
    });

    it("cancels operation when cancel button is clicked", async () => {
        const { floor, event } = await setupTestEnvironment();
        const sourceReservation = {
            id: "1",
            floorId: "1",
            tableLabel: "T1",
            type: ReservationType.PLANNED,
            status: ReservationStatus.ACTIVE,
        } as ReservationDoc;

        const result = withSetup(() =>
            useReservations(
                ref([]),
                ref([sourceReservation]),
                shallowRef([floor]),
                { id: "1", propertyId: "1", organisationId: "1" },
                ref(event),
            ),
        );

        const sourceTable = floor.getTableByLabel("T1")!;
        result.initiateTableOperation({
            type: TableOperationType.RESERVATION_TRANSFER,
            sourceFloor: floor,
            sourceTable,
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

        expect(result.currentTableOperation.value).toBeUndefined();
    });
});

function createTestReservation(overrides = {}): ReservationDoc {
    return {
        id: "1",
        floorId: "1",
        tableLabel: "T1",
        guestName: "John Doe",
        time: "19:00",
        status: ReservationStatus.ACTIVE,
        type: ReservationType.PLANNED,
        reservationConfirmed: false,
        cancelled: false,
        arrived: false,
        consumption: 0,
        reservedBy: {
            id: "1",
            name: "Test User",
        },
        ...overrides,
    } as ReservationDoc;
}

function withSetup(
    composable: () => ReturnType<typeof useReservations>,
    initialState: Partial<TestingOptions["initialState"]> = {},
): ReturnType<typeof useReservations> {
    let result: ReturnType<typeof useReservations>;
    const defaultInitialState = {
        auth: {
            user: {
                id: "1",
                email: "test@mail.com",
                role: ADMIN,
            },
        },
        properties: {
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
            organisations: [
                {
                    id: "1",
                },
            ],
        },
    };
    const testingPinia = createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
        initialState: {
            ...defaultInitialState,
            ...initialState,
        },
    });
    const i18n = createI18n({
        locale: "en-GB",
        fallbackLocale: "en-GB",
        messages,
        legacy: false,
    });
    app = createApp({
        setup() {
            result = composable();
            return noop;
        },
    });
    app.use(Quasar);
    Quasar.install(app, { plugins: { BottomSheet, Loading, Dialog, Notify } });
    app.use(i18n);
    app.use(testingPinia);

    const container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
    app.mount(container);

    return result!;
}

async function setupTestEnvironment(): Promise<{ floor: FloorViewer; event: EventDoc }> {
    const floor = await createTestFloor();
    const event: EventDoc = {
        id: "1",
        date: new Date().getTime(),
        name: "Test Event",
        propertyId: "1",
        organisationId: "1",
        creator: "test@mail.com",
        entryPrice: 0,
        guestListLimit: 100,
        _doc: {} as any,
    };

    return {
        floor,
        event,
    };
}

async function createTestFloor(name = "Test floor", id = "1"): Promise<FloorViewer> {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 600;
    document.body.appendChild(canvas);

    const editor = new FloorEditor({
        canvas: document.createElement("canvas"),
        floorDoc: {
            id,
            name,
            width: 500,
            height: 500,
            json: "",
        },
        containerWidth: 500,
    });

    editor.addElement({
        tag: FloorElementTypes.RECT_TABLE,
        label: "T1",
        x: 100,
        y: 100,
    });

    editor.addElement({
        tag: FloorElementTypes.RECT_TABLE,
        label: "T2",
        x: 200,
        y: 200,
    });

    const floorDoc: FloorDoc = {
        propertyId: "1",
        id,
        name,
        width: 400,
        height: 600,
        json: editor.json,
    };

    const floorViewer = new FloorViewer({
        canvas,
        floorDoc,
        containerWidth: 400,
    });

    await new Promise<void>((resolve) => {
        floorViewer.on("rendered", () => resolve());
    });

    return floorViewer;
}
