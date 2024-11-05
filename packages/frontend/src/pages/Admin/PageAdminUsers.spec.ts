import type { PageAdminUsersProps } from "./PageAdminUsers.vue";
import type { User, PropertyDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import PageAdminUsers from "./PageAdminUsers.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";
import { ref, nextTick } from "vue";
import { Role, UserCapability } from "@firetable/types";

import FTDialog from "src/components/FTDialog.vue";
import UserCreateForm from "src/components/admin/user/UserCreateForm.vue";
import { Loading } from "quasar";

const {
    createDialogSpy,
    showErrorMessageMock,
    tryCatchLoadingWrapperMock,
    showConfirmMock,
    useUsersMock,
} = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
    showErrorMessageMock: vi.fn(),
    tryCatchLoadingWrapperMock: vi.fn(),
    showConfirmMock: vi.fn(),
    useUsersMock: vi.fn(),
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

vi.mock("src/composables/useUsers", () => ({
    useUsers: useUsersMock,
}));

vi.mock("src/helpers/ui-helpers", async (importOriginal) => ({
    ...(await importOriginal()),
    showErrorMessage: showErrorMessageMock,
    tryCatchLoadingWrapper: tryCatchLoadingWrapperMock,
    showConfirm: showConfirmMock,
}));

vi.mock("quasar", async (importOriginal) => {
    return {
        ...(await importOriginal()),
        Loading: {
            show: vi.fn(),
            hide: vi.fn(),
            isActive: false,
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
                id: "user1",
                name: "John Doe",
                username: "john",
                organisationId,
                email: "john@example.com",
                role: Role.PROPERTY_OWNER,
                relatedProperties: ["property1", "property2"],
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                },
            },
            {
                id: "user2",
                name: "Jane Smith",
                username: "jane",
                email: "jane@example.com",
                organisationId,
                role: Role.STAFF,
                relatedProperties: ["property1"],
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                },
            },
            {
                id: "user3",
                name: "Bob Brown",
                username: "bob",
                organisationId,
                email: "bob@example.com",
                role: Role.STAFF,
                relatedProperties: [],
                capabilities: {
                    [UserCapability.CAN_RESERVE]: false,
                },
            },
        ];

        useUsersMock.mockReturnValue({
            users: ref(usersData),
            isLoading: ref(false),
            fetchUsers: vi.fn(),
        });
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
                        properties: propertiesData,
                        organisations: [{ id: organisationId, name: "Organisation One" }],
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
        expect(propertyTabs.elements().length).toBe(2);

        // Verify the tab labels include property names and user counts
        expect(propertyTabs.elements()[0]).toHaveTextContent("Property One (2)");
        expect(propertyTabs.elements()[1]).toHaveTextContent("Property Two (1)");

        // Check for unassigned users
        const unassignedText = screen.getByText(/Unassigned users/);
        await expect.element(unassignedText).toBeVisible();

        // Verify unassigned user is displayed
        const unassignedUser = screen.getByText("Bob Brown");
        await expect.element(unassignedUser).toBeVisible();
    });

    it("shows 'no users' message when there are no users", async () => {
        usersData = [];
        useUsersMock.mockReturnValue({
            users: ref(usersData),
            isLoading: ref(false),
            fetchUsers: vi.fn(),
        });

        const screen = render();

        await expect
            .element(screen.getByText(t("PageAdminUsers.noUsersCreatedMessage")))
            .toBeInTheDocument();
    });

    it("opens create user dialog when plus button is clicked", async () => {
        const screen = render();

        const addButton = screen.getByRole("button", { name: "" });
        await userEvent.click(addButton);

        expect(createDialogSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                component: FTDialog,
                componentProps: expect.objectContaining({
                    component: UserCreateForm,
                    title: t("PageAdminUsers.createNewUserDialogTitle"),
                }),
            }),
        );
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
        useUsersMock.mockReturnValue({
            users: ref(usersData),
            isLoading,
            fetchUsers: vi.fn(),
        });

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

    it("updates user count when users change", async () => {
        const users = ref(usersData);
        useUsersMock.mockReturnValue({
            users,
            isLoading: ref(false),
            fetchUsers: vi.fn(),
        });

        const screen = render();

        // Initial count
        await expect
            .element(screen.getByRole("heading", { level: 3 }))
            .toHaveTextContent(`${t("PageAdminUsers.title")} (3)`);

        // Add a new user
        users.value = [
            ...usersData,
            {
                id: "user4",
                name: "New User",
                username: "newuser",
                organisationId,
                email: "new@example.com",
                role: Role.STAFF,
                relatedProperties: [],
                capabilities: {
                    [UserCapability.CAN_RESERVE]: true,
                },
            },
        ];

        await nextTick();

        // Check updated count
        await expect
            .element(screen.getByRole("heading", { level: 3 }))
            .toHaveTextContent(`${t("PageAdminUsers.title")} (4)`);
    });
});
