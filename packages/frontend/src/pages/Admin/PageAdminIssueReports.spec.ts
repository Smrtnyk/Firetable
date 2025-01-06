import type { RenderResult } from "vitest-browser-vue";
import type { IssueReportDoc } from "@firetable/types";
import PageAdminIssueReports from "./PageAdminIssueReports.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { ref } from "vue";
import { IssueCategory, IssueStatus, AdminRole } from "@firetable/types";

const {
    createDialogSpy,
    useFirestoreCollectionMock,
    updateIssueReportMock,
    deleteIssueReportMock,
    notifyMock,
} = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    useFirestoreCollectionMock: vi.fn(),
    updateIssueReportMock: vi.fn(),
    deleteIssueReportMock: vi.fn(),
    notifyMock: vi.fn(),
}));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreCollection: useFirestoreCollectionMock,
}));

vi.mock("../../backend-proxy", () => ({
    updateIssueReport: updateIssueReportMock,
    deleteIssueReport: deleteIssueReportMock,
    getIssueReportsPath: vi.fn(),
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    useQuasar: () => ({
        notify: notifyMock,
    }),
}));

describe("PageAdminIssueReports.vue", () => {
    const mockIssues: IssueReportDoc[] = [
        {
            id: "issue1",
            description: "Test Bug",
            category: IssueCategory.BUG,
            status: IssueStatus.NEW,
            createdAt: Date.now(),
            createdBy: "user1",
            user: { name: "John Doe", email: "john@example.com" },
            organisation: { id: "org1", name: "Org 1" },
        },
        {
            id: "issue2",
            description: "Feature Request",
            category: IssueCategory.FEATURE_REQUEST,
            status: IssueStatus.IN_PROGRESS,
            createdAt: Date.now(),
            createdBy: "user2",
            user: { name: "Jane Doe", email: "jane@example.com" },
            organisation: { id: "org1", name: "Org 1" },
        },
    ];

    function render(): RenderResult<unknown> {
        return renderComponent(
            PageAdminIssueReports,
            {},
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                role: AdminRole.ADMIN,
                            },
                        },
                        properties: {
                            properties: [
                                {
                                    id: "prop1",
                                    name: "Property 1",
                                    organisationId: "org1",
                                },
                            ],
                            organisations: [
                                {
                                    id: "org1",
                                    name: "Org 1",
                                },
                            ],
                        },
                    },
                },
            },
        );
    }

    beforeEach(() => {
        useFirestoreCollectionMock.mockReturnValue({ data: ref(mockIssues) });
    });

    it("renders correctly when there are issues", async () => {
        const screen = render();

        await expect
            .element(screen.getByRole("heading", { name: t("PageAdminIssueReports.title") }))
            .toBeVisible();

        const issueItems = screen.getByRole("listitem");
        expect(issueItems.elements()).toHaveLength(2);

        await expect.element(screen.getByText("Test Bug")).toBeVisible();
        await expect.element(screen.getByText("Feature Request")).toBeVisible();
    });

    it("shows 'no issues' message when there are no issues", async () => {
        useFirestoreCollectionMock.mockReturnValue({ data: ref([]) });

        const screen = render();

        await expect
            .element(screen.getByText(t("PageAdminIssueReports.noIssuesMessage")))
            .toBeVisible();
    });

    describe("issue status updates", () => {
        it("updates issue status successfully", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);

            const inProgressOption = screen.getByLabelText("Set status to In Progress");
            await userEvent.click(inProgressOption);

            expect(updateIssueReportMock).toHaveBeenCalledWith("issue1", {
                status: IssueStatus.IN_PROGRESS,
            });
            expect(notifyMock).toHaveBeenCalledWith(t("PageAdminIssueReports.statusUpdated"));
        });
    });

    describe("issue deletion", () => {
        it("confirms before deleting issue", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText(t("ok")));

            expect(deleteIssueReportMock).toHaveBeenCalledWith("issue1");
        });

        it("does not delete issue if confirmation is cancelled", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText(t("cancel")));

            expect(deleteIssueReportMock).not.toHaveBeenCalled();
        });
    });

    it("displays user and organisation information correctly", async () => {
        const screen = render();

        await expect.element(screen.getByText("John Doe")).toBeVisible();
        await expect.element(screen.getByText("john@example.com")).toBeVisible();
        await expect.element(screen.getByText("Org 1").first()).toBeVisible();
    });

    it("displays correct status badges", async () => {
        const screen = render();

        const newStatusBadge = screen.getByText(t("PageAdminIssueReports.status.new"));
        const inProgressBadge = screen.getByText(t("PageAdminIssueReports.status.in_progress"));

        await expect.element(newStatusBadge).toBeVisible();
        await expect.element(inProgressBadge).toBeVisible();
    });
});
