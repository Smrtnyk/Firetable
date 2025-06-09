import type { OrganisationDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { OrganisationStatus } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import type { PageAdminOrganisationProps } from "./PageAdminOrganisation.vue";

import { cleanupAfterTest, renderComponent } from "../../../test-helpers/render-component";
import PageAdminOrganisation from "./PageAdminOrganisation.vue";

const { deleteOrganisationMock, routerReplaceMock, useFirestoreDocumentMock } = vi.hoisted(() => ({
    deleteOrganisationMock: vi.fn(),
    routerReplaceMock: vi.fn(),
    useFirestoreDocumentMock: vi.fn(),
}));

vi.mock("src/composables/useFirestore", () => ({
    createQuery: vi.fn(),
    useFirestoreCollection: vi.fn(),
    useFirestoreDocument: useFirestoreDocumentMock,
}));

vi.mock("src/db", () => ({
    deleteOrganisation: deleteOrganisationMock,
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    propertiesCollection: vi.fn(),
}));

vi.mock("vue-router", () => {
    return {
        useRouter: () => ({
            push: vi.fn(),
            replace: routerReplaceMock,
        }),
    };
});

describe("PageAdminOrganisation.vue", () => {
    let organisationData: OrganisationDoc;

    beforeEach(() => {
        organisationData = {
            id: "org1",
            maxAllowedProperties: 10,
            name: "Test Organisation",
            status: OrganisationStatus.ACTIVE,
        } as OrganisationDoc;

        useFirestoreDocumentMock.mockReturnValue({
            data: ref(),
        });
    });

    afterEach(() => {
        cleanupAfterTest();
    });

    function render(props = { organisationId: "org1" }): RenderResult<PageAdminOrganisationProps> {
        return renderComponent(PageAdminOrganisation, props, {
            includeGlobalComponents: true,
            piniaStoreOptions: {
                initialState: {
                    properties: {
                        organisations: [organisationData],
                    },
                },
            },
            wrapInLayout: true,
        });
    }

    it("renders organisation name as title", async () => {
        const screen = render();
        await expect.element(screen.getByText("Test Organisation", { exact: true })).toBeVisible();
    });

    it("displays organisation status with correct color", async () => {
        organisationData.status = OrganisationStatus.SUSPENDED;
        const screen = render();

        const statusChip = screen.getByLabelText("Status:");
        await expect.element(statusChip).toHaveClass("text-negative");
        await expect.element(statusChip).toHaveTextContent("Suspended");
    });

    it("shows delete confirmation dialog when delete button is clicked", async () => {
        const screen = render();
        await userEvent.click(screen.getByRole("button", { name: "Delete organisation" }));

        await expect.element(screen.getByRole("dialog")).toBeVisible();
        await expect.element(screen.getByText(/This action cannot be undone/)).toBeVisible();
    });

    it("prevents deletion when organisation name doesn't match", async () => {
        const screen = render();
        await userEvent.click(screen.getByRole("button", { name: "Delete organisation" }));

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "Wrong Name");
        await expect
            .element(screen.getByRole("button", { exact: true, name: "Confirm" }))
            .toBeDisabled();

        expect(deleteOrganisationMock).not.toHaveBeenCalled();
    });

    it("deletes organisation when name matches", async () => {
        const screen = render();
        await userEvent.click(screen.getByRole("button", { name: "Delete organisation" }));

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "Test Organisation");
        await userEvent.click(screen.getByRole("button", { exact: true, name: "Confirm" }));

        expect(deleteOrganisationMock).toHaveBeenCalledWith("org1");
        expect(routerReplaceMock).toHaveBeenCalledWith({
            name: "adminOrganisations",
        });
    });
});
