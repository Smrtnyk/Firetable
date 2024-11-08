import type { RenderResult } from "vitest-browser-vue";
import type { IssueReportDoc } from "@firetable/types";
import PageIssueReport from "./PageIssueReport.vue";
import { renderComponent, t } from "../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { ref } from "vue";
import { IssueCategory, IssueStatus, Role } from "@firetable/types";
import FTDialog from "src/components/FTDialog.vue";
import IssueCreateForm from "src/components/issue/IssueCreateForm.vue";

const {
    createDialogSpy,
    useFirestoreCollectionMock,
    createIssueReportMock,
    updateIssueReportMock,
    deleteIssueReportMock,
    notifyMock,
} = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    useFirestoreCollectionMock: vi.fn(),
    createIssueReportMock: vi.fn(),
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
    createQuery: vi.fn(),
    useFirestoreDocument: vi.fn(),
}));

vi.mock("../backend-proxy", () => ({
    createIssueReport: createIssueReportMock,
    updateIssueReport: updateIssueReportMock,
    deleteIssueReport: deleteIssueReportMock,
    fetchOrganisationById: vi.fn(),
    fetchOrganisationsForAdmin: vi.fn(),
    fetchPropertiesForAdmin: vi.fn(),
    propertiesCollection: vi.fn(),
    getUserPath: vi.fn(),
    logoutUser: vi.fn(),
    getIssueReportsPath: vi.fn(),
}));

vi.mock("quasar", async (importOriginal) => ({
    ...(await importOriginal()),
    useQuasar: () => ({
        notify: notifyMock,
    }),
    Loading: {
        show: vi.fn(),
        hide: vi.fn(),
    },
}));

describe("PageIssueReport.vue", () => {
    const mockIssues: IssueReportDoc[] = [
        {
            id: "issue1",
            description: "My Test Issue",
            category: IssueCategory.BUG,
            status: IssueStatus.NEW,
            createdAt: Date.now(),
            createdBy: "user1",
            user: { name: "John Doe", email: "john@example.com" },
            organisation: { id: "org1", name: "Org 1" },
        },
    ];

    const user = {
        id: "user1",
        role: Role.MANAGER,
        organisationId: "org1",
    };

    function render(): RenderResult<unknown> {
        const organisation = {
            id: "org1",
            name: "Test Organisation",
            settings: {
                event: {
                    eventStartTime24HFormat: "22:00",
                    eventDurationInHours: 10,
                },
            },
        };

        return renderComponent(
            PageIssueReport,
            {},
            {
                piniaStoreOptions: {
                    initialState: {
                        auth: {
                            user,
                        },
                        properties: {
                            properties: [
                                {
                                    id: "property1",
                                    name: "Property 1",
                                    organisationId: "org1",
                                },
                            ],
                            organisations: [organisation],
                        },
                    },
                },
            },
        );
    }

    beforeEach(() => {
        useFirestoreCollectionMock.mockReturnValue({ data: ref(mockIssues) });
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

            expect(createDialogSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    component: FTDialog,
                    componentProps: expect.objectContaining({
                        component: IssueCreateForm,
                        title: t("PageIssueReport.createNewIssue"),
                    }),
                }),
            );
        });
    });

    describe("edit issue", () => {
        it("opens edit dialog with prefilled data", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.edit")));

            expect(createDialogSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    component: FTDialog,
                    componentProps: expect.objectContaining({
                        component: IssueCreateForm,
                        title: t("PageIssueReport.editIssue"),
                        componentPropsObject: {
                            issueToEdit: mockIssues[0],
                        },
                    }),
                }),
            );
        });

        it("disables edit for resolved issues", async () => {
            useFirestoreCollectionMock.mockReturnValue({
                data: ref([{ ...mockIssues[0], status: IssueStatus.RESOLVED }]),
            });

            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);

            const editButton = screen.getByLabelText("Edit issue");
            await expect.element(editButton).toHaveAttribute("aria-disabled", "true");
        });
    });

    describe("delete issue", () => {
        it("confirms before deleting issue", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText("ok"));

            expect(deleteIssueReportMock).toHaveBeenCalledWith("issue1");
        });

        it("does not delete if confirmation is cancelled", async () => {
            const screen = render();

            const actionsButton = screen.getByLabelText("Actions for issue My Test Issue");
            await userEvent.click(actionsButton);
            await userEvent.click(screen.getByText(t("Global.delete")));
            await userEvent.click(screen.getByText("cancel"));

            expect(deleteIssueReportMock).not.toHaveBeenCalled();
        });
    });
});
