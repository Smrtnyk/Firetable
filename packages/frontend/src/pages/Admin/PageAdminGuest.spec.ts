import type { RenderResult } from "vitest-browser-vue";
import type { GuestDoc, PropertyDoc } from "@firetable/types";
import type { PageAdminGuestProps } from "./PageAdminGuest.vue";
import PageAdminGuest from "./PageAdminGuest.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import FTDialog from "src/components/FTDialog.vue";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import { ref } from "vue";
import { UTC } from "src/helpers/date-utils";
import { AdminRole } from "@firetable/types";

const { createDialogSpy, showConfirmMock, useFirestoreDocumentMock, tryCatchLoadingWrapperSpy } =
    vi.hoisted(() => ({
        createDialogSpy: vi.fn(),
        showConfirmMock: vi.fn(),
        useFirestoreDocumentMock: vi.fn(),
        tryCatchLoadingWrapperSpy: vi.fn(),
    }));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreDocument: useFirestoreDocumentMock,
    useFirestoreCollection: vi.fn(),
    createQuery: vi.fn(),
}));

vi.mock("src/helpers/ui-helpers", async function (importOriginal) {
    return {
        ...(await importOriginal()),
        showConfirm: showConfirmMock,
        tryCatchLoadingWrapper: tryCatchLoadingWrapperSpy,
    };
});

vi.mock("vue-router", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe("PageAdminGuest.vue", () => {
    let guestData: GuestDoc;
    let propertiesData: PropertyDoc[];

    beforeEach(() => {
        guestData = {
            id: "guest1",
            name: "John Doe",
            contact: "john@example.com",
            hashedContact: "hashedContact",
            maskedContact: "maskedContact",
            visitedProperties: {
                property1: {
                    visit1: {
                        date: new Date("2023-10-05T10:00:00Z").getTime(),
                        eventName: "Event A",
                        arrived: true,
                        cancelled: false,
                        isVIPVisit: true,
                    },
                    visit2: {
                        date: new Date("2023-10-03T15:30:00Z").getTime(),
                        eventName: "Event B",
                        arrived: false,
                        cancelled: false,
                        isVIPVisit: false,
                    },
                },
                property2: {
                    visit3: {
                        date: new Date("2023-09-15T20:00:00Z").getTime(),
                        eventName: "Event C",
                        arrived: false,
                        cancelled: true,
                        isVIPVisit: false,
                    },
                },
            },
        } as GuestDoc;

        propertiesData = [
            {
                id: "property1",
                name: "Property One",
                settings: {
                    timezone: UTC,
                },
            } as PropertyDoc,
            {
                id: "property2",
                name: "Property Two",
                settings: {
                    timezone: UTC,
                },
            } as PropertyDoc,
        ];

        useFirestoreDocumentMock.mockReturnValue({
            data: ref(guestData),
        });
    });

    function render(
        props = { organisationId: "org1", guestId: "guest1" },
    ): RenderResult<PageAdminGuestProps> {
        return renderComponent(PageAdminGuest, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: {
                        user: {
                            organisationId: "org1",
                            role: AdminRole.ADMIN,
                        },
                    },
                    properties: {
                        properties: propertiesData,
                    },
                },
            },
        });
    }

    it("renders guest information correctly", async () => {
        const screen = render();

        await expect.element(screen.getByText("John Doe")).toBeInTheDocument();
        await expect.element(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("renders visits sorted by date in descending order", () => {
        render();

        // Get the list of visit event names
        const visitEventNames = Array.from(document.querySelectorAll(".q-timeline__title")).map(
            (element) => element.textContent,
        );

        // Expected order: Most recent visit first and on first property tab
        expect(visitEventNames).toStrictEqual(["Event A", "Event B"]);
    });

    it("renders VIP chip for VIP visits", async () => {
        const screen = render();

        const vipChip = screen.getByText("VIP");
        await expect.element(vipChip).toBeVisible();

        // Verify that the VIP chip is associated with the correct visit
        const vipVisitEventName = screen.getByText("Event A");
        await expect
            .element(vipVisitEventName.element()!.closest(".q-timeline__content")!)
            .toContainElement(vipChip.element() as HTMLElement);
    });

    it("shows 'No visits' message when guest has no visits", async () => {
        guestData.visitedProperties = {};
        useFirestoreDocumentMock.mockReturnValue({
            data: ref(guestData),
        });

        const screen = render();

        await expect
            .element(screen.getByText(t("PageAdminGuest.noVisitsMessage")))
            .toBeInTheDocument();
    });

    it("opens edit guest dialog when edit button is clicked", async () => {
        showConfirmMock.mockResolvedValue(true);
        const screen = render();
        const editButton = screen.getByLabelText("Edit guest");
        await userEvent.click(editButton);

        expect(createDialogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                component: FTDialog,
                componentProps: expect.objectContaining({
                    component: AddNewGuestForm,
                    componentPropsObject: expect.objectContaining({
                        mode: "edit",
                        initialData: guestData,
                    }),
                    maximized: false,
                    title: t("PageAdminGuest.editGuestDialogTitle", {
                        name: guestData.name,
                    }),
                    listeners: expect.any(Object),
                }),
            }),
        );
    });

    it("asks for confirmation before deleting guest", async () => {
        const screen = render();

        showConfirmMock.mockResolvedValue(true);

        const deleteButton = screen.getByLabelText("Delete guest");
        await userEvent.click(deleteButton);

        expect(showConfirmMock).toHaveBeenCalledWith(
            t("PageAdminGuest.deleteGuestConfirmTitle"),
            t("PageAdminGuest.deleteGuestConfirmMessage"),
        );
        expect(tryCatchLoadingWrapperSpy).toHaveBeenCalled();
    });

    it("does not delete guest if confirmation is cancelled", async () => {
        const screen = render();

        showConfirmMock.mockResolvedValue(false);

        const deleteButton = screen.getByLabelText("Delete guest");
        await userEvent.click(deleteButton);

        expect(showConfirmMock).toHaveBeenCalled();
        expect(tryCatchLoadingWrapperSpy).not.toHaveBeenCalled();
    });

    it("switches tabs when a different property is selected", async () => {
        const screen = render();

        // By default, the first property tab should be selected
        const activeTab = screen.getByRole("tab", { selected: true });
        await expect.element(activeTab).toHaveTextContent("Property One");

        // Click on the second property tab
        const propertyTwoTab = screen.getByText("Property Two");
        await userEvent.click(propertyTwoTab);

        // Now the active tab should be "Property Two"
        const newActiveTab = screen.getByRole("tab", { selected: true });
        await expect.element(newActiveTab).toHaveTextContent("Property Two");

        // Verify that the visits for Property Two are displayed
        await expect.element(screen.getByText("Event C")).toBeInTheDocument();
    });

    it("shows formatted visit dates", () => {
        render();

        const formattedDates = Array.from(document.querySelectorAll(".q-timeline__subtitle")).map(
            (element) => element.textContent,
        );

        expect(formattedDates).toEqual(["05/10/2023, 10:00:00", "03/10/2023, 15:30:00"]);
    });

    it("shows 'No visits' message when guest has properties with no visits", async () => {
        // Guest has properties, but no visits
        guestData.visitedProperties = {
            property1: {},
            property2: {},
        };

        const screen = render();

        await expect
            .element(screen.getByText(t("PageAdminGuest.noVisitsMessage")))
            .toBeInTheDocument();
    });

    it("shows 'Upcoming' chip for future visits", async () => {
        const futureDate = new Date();
        // Tomorrow
        futureDate.setDate(futureDate.getDate() + 1);
        const pastDate = new Date();
        // Yesterday
        pastDate.setDate(pastDate.getDate() - 1);

        guestData.visitedProperties = {
            property1: {
                futureVisit: {
                    date: futureDate.getTime(),
                    eventName: "Future Event",
                    arrived: false,
                    cancelled: false,
                    isVIPVisit: false,
                },
                pastVisit: {
                    date: pastDate.getTime(),
                    eventName: "Past Event",
                    arrived: true,
                    cancelled: false,
                    isVIPVisit: false,
                },
            },
        };

        const screen = render();

        // Check for the future visit
        const futureEventNameElement = screen.getByText("Future Event");
        await expect.element(futureEventNameElement).toBeInTheDocument();

        const futureTimelineEntry = futureEventNameElement
            .element()!
            .closest(".q-timeline__entry")!;
        const upcomingChip = futureTimelineEntry.querySelector(".q-chip");
        await expect.element(upcomingChip!).toHaveTextContent("Upcoming");

        // Check for the past visit
        const pastEventNameElement = screen.getByText("Past Event");
        await expect.element(pastEventNameElement).toBeInTheDocument();

        const pastTimelineEntry = pastEventNameElement.element()!.closest(".q-timeline__entry")!;
        const chipsInPastEvent = pastTimelineEntry.querySelectorAll(".q-chip");
        const hasUpcomingChip = Array.from(chipsInPastEvent).some(
            (chip) => chip.textContent === "Upcoming",
        );
        expect(hasUpcomingChip).toBe(false);
    });

    it("does not render tabs when there is only one property", async () => {
        // Modify guestData to have only one property
        guestData.visitedProperties = {
            property1: {
                visit1: {
                    date: new Date("2023-10-05T10:00:00Z").getTime(),
                    eventName: "Event A",
                    arrived: true,
                    cancelled: false,
                    isVIPVisit: true,
                },
                visit2: {
                    date: new Date("2023-10-03T15:30:00Z").getTime(),
                    eventName: "Event B",
                    arrived: false,
                    cancelled: false,
                    isVIPVisit: false,
                },
            },
        };

        useFirestoreDocumentMock.mockReturnValue({
            data: ref(guestData),
        });

        const screen = render();

        await expect.element(screen.getByRole("tab")).not.toBeInTheDocument();

        await expect.element(screen.getByText("Event A")).toBeInTheDocument();
        await expect.element(screen.getByText("Event B")).toBeInTheDocument();
    });

    it("renders guest tags when they exist", async () => {
        guestData.tags = ["VIP", "Frequent Visitor", "Newsletter Subscriber"];

        const screen = render();

        await expect.element(screen.getByText("Tags:")).toBeVisible();

        for (const tag of guestData.tags) {
            const tagLocator = screen.getByLabelText(`Guest tag ${tag}`);
            await expect.element(tagLocator).toHaveTextContent(tag);
            await expect.element(tagLocator).toBeVisible();
        }
    });

    it("does not render tags when guest has no tags", async () => {
        guestData.tags = [];
        const screen = render();

        const tagsLabel = screen.getByText("Tags:");
        await expect.element(tagsLabel).not.toBeInTheDocument();
    });
});
