import type { IssueReportDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { AdminRole, IssueCategory, IssueStatus } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { useGlobalStore } from "src/stores/global-store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { mockedStore } from "../../../test-helpers/mocked-store";
import { cleanupAfterTest, renderComponent, t } from "../../../test-helpers/render-component";
import PageAdminIssueReports from "./PageAdminIssueReports.vue";

const {
    createDialogSpy,
    deleteIssueReportMock,
    updateIssueReportMock,
    useFirestoreCollectionMock,
} = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    deleteIssueReportMock: vi.fn(),
    updateIssueReportMock: vi.fn(),
    useFirestoreCollectionMock: vi.fn(),
}));

vi.mock(import("src/composables/useDialog"), async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        globalDialog: {
            ...original.globalDialog,
            openDialog: createDialogSpy,
        },
    };
});

vi.mock("src/composables/useFirestore", () => ({
    useFirestoreCollection: useFirestoreCollectionMock,
}));

vi.mock("src/db", () => ({
    deleteIssueReport: deleteIssueReportMock,
    getIssueReportsPath: vi.fn(),
    updateIssueReport: updateIssueReportMock,
}));

describe("PageAdminIssueReports.vue", () => {
    const mockIssues: IssueReportDoc[] = [
        {
            category: IssueCategory.BUG,
            createdAt: Date.now(),
            createdBy: "user1",
            description: "Test Bug",
            id: "issue1",
            organisation: { id: "org1", name: "Org 1" },
            status: IssueStatus.NEW,
            user: { email: "john@example.com", name: "John Doe" },
        },
        {
            category: IssueCategory.FEATURE_REQUEST,
            createdAt: Date.now(),
            createdBy: "user2",
            description: "Feature Request",
            id: "issue2",
            organisation: { id: "org1", name: "Org 1" },
            status: IssueStatus.IN_PROGRESS,
            user: { email: "jane@example.com", name: "Jane Doe" },
        },
    ];

    function render(): RenderResult<unknown> {
        return renderComponent(
            PageAdminIssueReports,
            {},
            {
                includeGlobalComponents: true,
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user: {
                                role: AdminRole.ADMIN,
                            },
                        },
                        properties: {
                            organisations: [
                                {
                                    id: "org1",
                                    name: "Org 1",
                                },
                            ],
                            properties: [
                                {
                                    id: "prop1",
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
        document.body.innerHTML = "";
    });

    it("renders correctly when there are issues", async () => {
        const screen = render();

        await expect
            .element(screen.getByRole("heading", { name: t("PageAdminIssueReports.title") }))
            .toBeVisible();

        const issueItems = screen.getByLabelText("Issue report item");
        expect(issueItems.all()).toHaveLength(2);

        await expect.element(screen.getByText("Test Bug", { exact: true })).toBeVisible();
        const featureIssue = screen.getByText("Feature Request", { exact: true }).nth(1);
        screen.debug(featureIssue);
        await expect.element(featureIssue).toBeVisible();
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
            const globalStore = mockedStore(useGlobalStore);

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);

            const inProgressOption = screen.getByLabelText("Set status to In Progress");
            await userEvent.click(inProgressOption);

            expect(updateIssueReportMock).toHaveBeenCalledWith("issue1", {
                status: IssueStatus.IN_PROGRESS,
            });
            expect(globalStore.notify).toHaveBeenCalledWith(
                t("PageAdminIssueReports.statusUpdated"),
            );
        });
    });

    describe("issue deletion", () => {
        it("confirms before deleting issue", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText("Yes"));

            expect(deleteIssueReportMock).toHaveBeenCalledWith("issue1");
        });

        it("does not delete issue if confirmation is cancelled", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue Test Bug");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText("No"));

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
