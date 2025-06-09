import type { IssueReportDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { IssueCategory, IssueStatus, Role } from "@firetable/types";
import { page, userEvent } from "@vitest/browser/context";
import { globalDialog } from "src/composables/useDialog";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { cleanupAfterTest, renderComponent, t } from "../../test-helpers/render-component";
import PageIssueReport from "./PageIssueReport.vue";

const {
    createIssueReportMock,
    deleteIssueReportMock,
    updateIssueReportMock,
    useFirestoreCollectionMock,
} = vi.hoisted(() => ({
    createIssueReportMock: vi.fn(),
    deleteIssueReportMock: vi.fn(),
    updateIssueReportMock: vi.fn(),
    useFirestoreCollectionMock: vi.fn(),
}));

vi.mock("src/composables/useFirestore", () => ({
    createQuery: vi.fn(),
    useFirestoreCollection: useFirestoreCollectionMock,
    useFirestoreDocument: vi.fn(),
}));

vi.mock("src/db", () => ({
    createIssueReport: createIssueReportMock,
    deleteIssueReport: deleteIssueReportMock,
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    getIssueReportsPath: vi.fn(),
    getUserPath: vi.fn(),
    logoutUser: vi.fn(),
    propertiesCollection: vi.fn(),
    updateIssueReport: updateIssueReportMock,
}));

describe("PageIssueReport.vue", () => {
    const mockIssues: IssueReportDoc[] = [
        {
            category: IssueCategory.BUG,
            createdAt: Date.now(),
            createdBy: "user1",
            description: "My Test Issue",
            id: "issue1",
            organisation: { id: "org1", name: "Org 1" },
            status: IssueStatus.NEW,
            user: { email: "john@example.com", name: "John Doe" },
        },
    ];

    const user = {
        id: "user1",
        organisationId: "org1",
        role: Role.MANAGER,
    };

    function render(): RenderResult<unknown> {
        const organisation = {
            id: "org1",
            name: "Test Organisation",
            settings: {
                event: {
                    eventDurationInHours: 10,
                    eventStartTime24HFormat: "22:00",
                },
            },
        };

        return renderComponent(
            PageIssueReport,
            {},
            {
                includeGlobalComponents: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user,
                        },
                        properties: {
                            organisations: [organisation],
                            properties: [
                                {
                                    id: "property1",
                                    name: "Property 1",
                                    organisationId: "org1",
                                },
                            ],
                        },
                    },
                },
                wrapInLayout: true,
            },
        );
    }

    beforeEach(() => {
        useFirestoreCollectionMock.mockReturnValue({ data: ref(mockIssues) });
    });

    afterEach(() => {
        cleanupAfterTest();
    });

    it("renders correctly with user's issues", async () => {
        const screen = render();

        await expect
            .element(screen.getByRole("heading", { name: t("PageIssueReport.title") }))
            .toBeVisible();
        await expect
            .element(screen.getByRole("heading", { name: t("PageIssueReport.myIssues") }))
            .toBeVisible();

        await expect.element(screen.getByText("My Test Issue")).toBeVisible();
    });

    it("shows 'no issues' message when user has no issues", async () => {
        useFirestoreCollectionMock.mockReturnValue({ data: ref([]) });

        const screen = render();

        await expect.element(screen.getByText(t("PageIssueReport.noIssuesMessage"))).toBeVisible();
    });

    describe("create issue", () => {
        it("opens create issue dialog when add button is clicked", async () => {
            const screen = render();

            const addButton = screen.getByLabelText("Report new issue");
            await userEvent.click(addButton);

            await expect
                .element(screen.getByText(t("PageIssueReport.createNewIssue")))
                .toBeVisible();
        });
    });

    describe("edit issue", () => {
        it("opens edit dialog with prefilled data", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.edit")));

            await expect.element(screen.getByText(t("PageIssueReport.editIssue"))).toBeVisible();
        });

        it("disables edit for resolved issues", async () => {
            const openDialogSpy = vi.spyOn(globalDialog, "openDialog");
            useFirestoreCollectionMock.mockReturnValue({
                data: ref([{ ...mockIssues[0], status: IssueStatus.RESOLVED }]),
            });

            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByLabelText("Edit issue"), { force: true });
            expect(openDialogSpy).not.toHaveBeenCalled();
        });
    });

    describe("delete issue", () => {
        it("confirms before deleting issue", async () => {
            await page.viewport(1200, 800);
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByRole("button", { name: "Yes" }), { force: true });

            expect(deleteIssueReportMock).toHaveBeenCalledWith("issue1");
        });

        it("does not delete if confirmation is cancelled", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete"), { exact: true }));
            await userEvent.click(screen.getByText("No"));

            expect(deleteIssueReportMock).not.toHaveBeenCalled();
        });
    });
});
