import type { OrganisationDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { OrganisationStatus } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import type { PageAdminOrganisationProps } from "./PageAdminOrganisation.vue";

import { renderComponent } from "../../../test-helpers/render-component";
import PageAdminOrganisation from "./PageAdminOrganisation.vue";

const { deleteOrganisationMock, useFirestoreDocumentMock } = vi.hoisted(() => ({
    deleteOrganisationMock: vi.fn(),
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
        }),
    };
});

describe("PageAdminOrganisation.vue", () => {
    let organisationData: OrganisationDoc;

    beforeEach(() => {
        const dialogs = document.querySelectorAll(".q-dialog");
        dialogs.forEach((dialog) => dialog.remove());

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

    function render(props = { organisationId: "org1" }): RenderResult<PageAdminOrganisationProps> {
        return renderComponent(PageAdminOrganisation, props, {
            piniaStoreOptions: {
                initialState: {
                    properties: {
                        organisations: [organisationData],
                    },
                },
            },
        });
    }

    it("renders organisation name as title", async () => {
        const screen = render();
        await expect.element(screen.getByText("Test Organisation", { exact: true })).toBeVisible();
    });

    it("displays organisation status with correct color", async () => {
        organisationData.status = OrganisationStatus.SUSPENDED;
        const screen = render();

        const statusChip = screen.getByLabelText("Organisation status");
        await expect.element(statusChip).toHaveClass("bg-negative");
        await expect.element(statusChip).toHaveTextContent("Suspended");
    });

    it("shows delete confirmation dialog when delete button is clicked", async () => {
        const screen = render();
        await userEvent.click(screen.getByLabelText("Delete organisation"));

        await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
        await expect.element(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it("prevents deletion when organisation name doesn't match", async () => {
        const screen = render();
        await userEvent.click(screen.getByLabelText("Delete organisation"));

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "Wrong Name");
        await expect
            .element(screen.getByRole("button", { exact: true, name: "OK" }))
            .toBeDisabled();

        expect(deleteOrganisationMock).not.toHaveBeenCalled();
    });

    it("deletes organisation when name matches", async () => {
        const screen = render();
        await userEvent.click(screen.getByLabelText("Delete organisation"));

        const input = screen.getByRole("textbox");
        await userEvent.type(input, "Test Organisation");
        await userEvent.click(screen.getByRole("button", { exact: true, name: "OK" }));

        expect(deleteOrganisationMock).toHaveBeenCalledWith("org1");
    });
});
