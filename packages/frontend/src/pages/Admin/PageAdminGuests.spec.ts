import type { RenderResult } from "vitest-browser-vue";
import type { GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import type { PageAdminGuestsProps } from "./PageAdminGuests.vue";

import PageAdminGuests from "./PageAdminGuests.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import FTDialog from "src/components/FTDialog.vue";
import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";

import { describe, it, expect, beforeEach, vi } from "vitest";
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
    let guestsData: GuestDoc[];
    let propertiesData: PropertyDoc[];

    beforeEach(() => {
        guestsData = [
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
        ];

        propertiesData = [
            { id: "property1", name: "Property One" } as PropertyDoc,
            { id: "property2", name: "Property Two" } as PropertyDoc,
        ];

        useFirestoreCollectionMock.mockReturnValue({
            data: {
                value: guestsData,
            },
        });
    });

    function render(props = { organisationId: "org1" }): RenderResult<PageAdminGuestsProps> {
        return renderComponent(PageAdminGuests, props, {
            piniaStoreOptions: {
                initialState: {
                    properties: {
                        properties: propertiesData,
                    },
                },
            },
        });
    }

    it("renders correctly when there are guests", async () => {
        const screen = render();

        await expect.element(screen.getByText(t("PageAdminGuests.title"))).toBeInTheDocument();
        await expect.element(screen.getByText("John Doe - john@example.com")).toBeInTheDocument();
        await expect
            .element(screen.getByText("Property One visits: 2, Property Two visits: 1"))
            .toBeInTheDocument();
        await expect.element(screen.getByText("Jane Smith - jane@example.com")).toBeInTheDocument();
        await expect.element(screen.getByText("Property One visits: 1")).toBeInTheDocument();
    });

    it("renders guests sorted by number of visits", () => {
        const screen = render();
        const guestItems = screen.getByRole("listitem");

        expect(guestItems.elements()).toHaveLength(2);

        // First guest should be John Doe (3 visits)
        expect(guestItems.elements()[0]).toHaveTextContent("John Doe - john@example.com");
        // Second guest should be Jane Smith (1 visit)
        expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith - jane@example.com");
    });

    it("shows 'No guests data' when there are no guests", async () => {
        guestsData = [];
        useFirestoreCollectionMock.mockReturnValue({
            data: {
                value: guestsData,
            },
        });

        const screen = render();

        await expect.element(screen.getByText("No guests data")).toBeInTheDocument();
    });

    it("opens the add new guest dialog when plus button is clicked", async () => {
        const screen = render();

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

    it.todo("navigates to guest detail when a guest item is clicked", async () => {
        const screen = render();

        const guestItem = screen.getByText("John Doe - john@example.com");
        await userEvent.click(guestItem);

        // Assert navigation
    });
});
