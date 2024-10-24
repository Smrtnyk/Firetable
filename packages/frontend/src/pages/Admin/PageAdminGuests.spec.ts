import type { RenderResult } from "vitest-browser-vue";
import type { GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import type { PageAdminGuestsProps } from "./PageAdminGuests.vue";

import type { Ref } from "vue";
import PageAdminGuests from "./PageAdminGuests.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { ref } from "vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

const { createDialogSpy, useFirestoreCollectionMock } = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    useFirestoreCollectionMock: vi.fn(),
}));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreCollection: useFirestoreCollectionMock,
    createQuery: vi.fn(),
}));

describe("PageAdminGuests.vue", () => {
    let guestsData: Ref<GuestDoc[]>;
    let propertiesData: PropertyDoc[];

    beforeEach(() => {
        guestsData = ref([
            {
                id: "guest1",
                name: "John Doe",
                contact: "john@example.com",
                hashedContact: "hashedContact",
                maskedContact: "maskedContact",
                visitedProperties: {
                    property1: {
                        visit1: { date: new Date("2023-10-01").getTime() } as Visit,
                        visit2: { date: new Date("2023-10-05").getTime() } as Visit,
                    },
                    property2: {
                        visit3: { date: new Date("2023-09-15").getTime() } as Visit,
                    },
                },
            } as GuestDoc,
            {
                id: "guest2",
                name: "Jane Smith",
                contact: "jane@example.com",
                hashedContact: "hashedContact",
                maskedContact: "maskedContact",
                visitedProperties: {
                    property1: {
                        visit4: { date: new Date("2023-08-20").getTime() } as Visit,
                    },
                },
            } as GuestDoc,
            {
                id: "guest3",
                name: "Alice Johnson",
                contact: "alice@example.com",
                hashedContact: "hashedContact",
                maskedContact: "maskedContact",
                visitedProperties: {},
            } as GuestDoc,
        ]);

        propertiesData = [
            { id: "property1", name: "Property One" } as PropertyDoc,
            { id: "property2", name: "Property Two" } as PropertyDoc,
        ];

        useFirestoreCollectionMock.mockReturnValue({
            data: guestsData,
            pending: ref(false),
        });
    });

    async function render(
        props = { organisationId: "org1" },
    ): Promise<RenderResult<PageAdminGuestsProps>> {
        const renderResult = renderComponent(PageAdminGuests, props, {
            piniaStoreOptions: {
                initialState: {
                    properties: {
                        properties: propertiesData,
                    },
                },
            },
        });

        try {
            await vi.waitUntil(() => document.querySelector(".q-virtual-scroll .q-item"));
        } catch (e) {
            // Empty catch block to prevent test failure
        }

        return renderResult;
    }

    it("renders correctly when there are guests", async () => {
        const screen = await render();

        await expect.element(screen.getByRole("heading", { name: "Guests" })).toBeVisible();
        await expect.element(screen.getByText("John Doe")).toBeVisible();
        await expect.element(screen.getByText("Jane Smith")).toBeVisible();
        await expect.element(screen.getByText("Alice Johnson")).toBeVisible();

        const percentage = screen.getByText("0.00%");
        expect(percentage.elements()).toHaveLength(3);

        const arrived = screen.getByText("Arrived: 0");
        expect(arrived.elements()).toHaveLength(3);
    });

    it("renders guests sorted by number of visits", async () => {
        const screen = await render();

        const guestItems = screen.getByRole("listitem");

        expect(guestItems.elements()).toHaveLength(3);

        // First guest should be John Doe (3 visits)
        expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
        // Second guest should be Jane Smith (1 visit)
        expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
        // Third guest should be Alice Johnson (0 visits)
        expect(guestItems.elements()[2]).toHaveTextContent("Alice Johnson");
    });

    it("shows 'No guests data' when there are no guests", async () => {
        guestsData = ref<GuestDoc[]>([]);
        useFirestoreCollectionMock.mockReturnValue({
            data: guestsData,
            pending: ref(false),
        });

        const screen = await render();

        await expect.element(screen.getByText("No guests data")).toBeInTheDocument();
    });

    it("opens the add new guest dialog when plus button is clicked", async () => {
        const screen = await render();

        const addButton = screen.getByLabelText("Add new guest");
        await userEvent.click(addButton);

        expect(createDialogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                component: FTDialog,
                componentProps: expect.objectContaining({
                    title: t("PageAdminGuests.createNewGuestDialogTitle"),
                    maximized: false,
                    component: AddNewGuestForm,
                    listeners: expect.any(Object),
                }),
            }),
        );
    });

    describe("search", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("filters guests by name based on search input", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "Jane");
            // Debounced search
            await vi.advanceTimersByTimeAsync(301);

            // Only Jane Smith should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
        });

        it("filters guests by contact based on search input", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "alice@example.com");
            await vi.advanceTimersByTimeAsync(301);

            // Only Alice Johnson should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("Alice Johnson");
        });

        it("is case-insensitive when filtering guests", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "jOhN d");
            await vi.advanceTimersByTimeAsync(301);

            // Only John Doe should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
        });

        it("shows multiple guests when search matches multiple entries", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "example.com");
            await vi.advanceTimersByTimeAsync(301);

            // All guests should be visible since all have contacts ending with example.com
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
            expect(guestItems.elements()[2]).toHaveTextContent("Alice Johnson");
        });

        it("shows 'No guests data' when search yields no results", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "NonExistentGuest");
            await vi.advanceTimersByTimeAsync(301);

            // No guests should be visible, show 'No guests data' message
            await expect
                .element(screen.getByText(t("PageAdminGuests.noGuestsData")))
                .toBeInTheDocument();
        });

        it("clears search input and shows all guests", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search guests");
            await userEvent.type(searchInput, "Jane");
            await vi.advanceTimersByTimeAsync(301);

            // Only Jane Smith should be visible
            let guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");

            // Clear the search input
            const clearButton = screen.getByLabelText("Clear");
            await userEvent.click(clearButton);
            await vi.advanceTimersByTimeAsync(301);

            // All guests should be visible again
            guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);
        });
    });

    it.todo("navigates to guest detail when a guest item is clicked", async () => {
        const screen = await render();

        const guestItem = screen.getByText("John Doe - john@example.com");
        await userEvent.click(guestItem);

        // Assert navigation
    });
});
