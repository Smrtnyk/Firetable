import type { PropertyDoc, User } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { Role, UserCapability } from "@firetable/types";
import { userEvent } from "@vitest/browser/context";
import { Loading } from "quasar";
import UserCreateForm from "src/components/admin/user/UserCreateForm.vue";
import FTDialog from "src/components/FTDialog.vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";

import type { PageAdminUsersProps } from "./PageAdminUsers.vue";

import { renderComponent, t } from "../../../test-helpers/render-component";
import PageAdminUsers from "./PageAdminUsers.vue";

const {
    createDialogSpy,
    fetchUsersByRoleMock,
    showConfirmMock,
    showErrorMessageMock,
    tryCatchLoadingWrapperMock,
} = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    fetchUsersByRoleMock: vi.fn(),
    showConfirmMock: vi.fn(),
    showErrorMessageMock: vi.fn(),
    tryCatchLoadingWrapperMock: vi.fn(),
}));

vi.mock("vue-router", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

vi.mock("src/db", async (importOriginal) => ({
    ...(await importOriginal()),
    fetchUsersByRole: fetchUsersByRoleMock,
}));

vi.mock("src/helpers/ui-helpers", async (importOriginal) => ({
    ...(await importOriginal()),
    showConfirm: showConfirmMock,
    showErrorMessage: showErrorMessageMock,
    tryCatchLoadingWrapper: tryCatchLoadingWrapperMock,
}));

vi.mock("quasar", async (importOriginal) => {
    return {
        ...(await importOriginal()),
        Loading: {
            hide: vi.fn(),
            isActive: false,
            show: vi.fn(),
        },
    };
});

const organisationId = "org1";

describe("PageAdminUsers.vue", () => {
    let usersData: User[];
    let propertiesData: PropertyDoc[];

    beforeEach(() => {
        propertiesData = [
            { id: "property1", name: "Property One", organisationId } as PropertyDoc,
            { id: "property2", name: "Property Two", organisationId } as PropertyDoc,
        ];

        usersData = [
            {
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                },
                email: "john@example.com",
                id: "user1",
                name: "John Doe",
                organisationId,
                relatedProperties: ["property1", "property2"],
                role: Role.PROPERTY_OWNER,
                username: "john",
            },
            {
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                },
                email: "jane@example.com",
                id: "user2",
                name: "Jane Smith",
                organisationId,
                relatedProperties: ["property1"],
                role: Role.STAFF,
                username: "jane",
            },
            {
                capabilities: {
                    [UserCapability.CAN_RESERVE]: false,
                },
                email: "bob@example.com",
                id: "user3",
                name: "Bob Brown",
                organisationId,
                relatedProperties: [],
                role: Role.STAFF,
                username: "bob",
            },
        ];

        fetchUsersByRoleMock.mockResolvedValue(usersData);
    });

    function render(
        props: PageAdminUsersProps = { organisationId: "org1" },
    ): RenderResult<PageAdminUsersProps> {
        return renderComponent(PageAdminUsers, props, {
            piniaStoreOptions: {
                initialState: {
                    auth: {
                        user: {
                            id: "user1",
                            role: Role.PROPERTY_OWNER,
                        },
                    },
                    properties: {
                        organisations: [{ id: organisationId, name: "Organisation One" }],
                        properties: propertiesData,
                    },
                },
            },
        });
    }

    it("renders users correctly", async () => {
        const screen = render();

        // Check that the title is rendered
        await expect
            .element(screen.getByRole("heading", { level: 3 }))
            .toHaveTextContent(t("PageAdminUsers.title"));

        // Check that the users are rendered under their respective properties
        const propertyTabs = screen.getByRole("tab");
        expect(propertyTabs.all()).toHaveLength(2);

        // Verify the tab labels include property names and user counts
        await expect.element(propertyTabs.first()).toHaveTextContent("Property One (2)");
        await expect.element(propertyTabs.nth(1)).toHaveTextContent("Property Two (1)");

        // Check for unassigned users
        const unassignedText = screen.getByText(/Unassigned users/);
        await expect.element(unassignedText).toBeVisible();

        // Verify unassigned user is displayed
        const unassignedUser = screen.getByText("Bob Brown");
        await expect.element(unassignedUser).toBeVisible();
    });

    it("shows 'no users' message when there are no users", async () => {
        usersData = [];
        fetchUsersByRoleMock.mockResolvedValue(usersData);

        const screen = render();

        await expect
            .element(screen.getByText(t("PageAdminUsers.noUsersCreatedMessage")))
            .toBeInTheDocument();
    });

    it("opens create user dialog when plus button is clicked", async () => {
        const screen = render();
        const addButton = screen.getByRole("button", { name: "" });
        await userEvent.click(addButton);

        const [[dialogArg]] = createDialogSpy.mock.calls;
        expect(dialogArg.component).toBe(FTDialog);
        expect(dialogArg.componentProps).toMatchObject({
            component: UserCreateForm,
            title: t("PageAdminUsers.createNewUserDialogTitle"),
        });
        expect(dialogArg.componentProps).toHaveProperty("componentPropsObject.organisation", {
            id: "org1",
            name: "Organisation One",
        });
        expect(dialogArg.componentProps).toHaveProperty(
            "componentPropsObject.properties",
            expect.any(Array),
        );
        expect(dialogArg.componentProps).toHaveProperty("listeners.submit", expect.any(Function));
    });

    it("shows 'no properties' message when there are no properties", async () => {
        propertiesData = [];
        const screen = render();

        await expect
            .element(screen.getByText("In order to list users, create some properties first"))
            .toBeInTheDocument();
    });

    it("shows loading indicator when isLoading is true", async () => {
        const isLoading = ref(true);
        fetchUsersByRoleMock.mockResolvedValue(usersData);

        render();

        expect(Loading.show).toHaveBeenCalled();

        isLoading.value = false;

        await nextTick();

        expect(Loading.hide).toHaveBeenCalled();
    });

    it("does not render tabs when there is only one property", async () => {
        propertiesData = [{ id: "property1", name: "Property One", organisationId }];

        const screen = render();

        const tabs = screen.getByRole("tab");
        await expect.element(tabs).not.toBeInTheDocument();

        const userItem = screen.getByText("John Doe");
        await expect.element(userItem).toBeVisible();
    });

    it("renders title with correct user count", async () => {
        const screen = render();

        await expect
            .element(screen.getByRole("heading", { level: 3 }))
            .toHaveTextContent(`${t("PageAdminUsers.title")} (3)`);
    });
});
