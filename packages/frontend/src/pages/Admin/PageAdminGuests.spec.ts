import type { RenderResult } from "vitest-browser-vue";
import type { AppUser, GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import type { PageAdminGuestsProps } from "./PageAdminGuests.vue";

import type { Ref } from "vue";
import PageAdminGuests from "./PageAdminGuests.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { ref, nextTick } from "vue";
import { AdminRole, Role } from "@firetable/types";

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

vi.mock("vue-router");

type GuestsState = {
    data: GuestDoc[];
    pending: boolean;
};

describe("PageAdminGuests.vue", () => {
    let guestsData: GuestDoc[];
    let propertiesData: PropertyDoc[];
    let authState: { user: AppUser };
    let guestsRef: Ref<GuestsState>;
    let refsMap: Map<string, Ref<GuestsState>>;

    beforeEach(() => {
        // Clear because filters are persisted
        localStorage.clear();

        authState = {
            user: {
                id: "admin1",
                name: "Admin User",
                email: "admin@example.com",
                username: "adminuser",
                role: AdminRole.ADMIN,
                // Irrelevant for admin
                relatedProperties: [],
                organisationId: "org1",
                capabilities: undefined,
            },
        };
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
            {
                id: "guest3",
                name: "Alice Johnson",
                contact: "alice@example.com",
                hashedContact: "hashedContact",
                maskedContact: "maskedContact",
                visitedProperties: {},
            } as GuestDoc,
        ];

        propertiesData = [
            { id: "property1", name: "Property One" } as PropertyDoc,
            { id: "property2", name: "Property Two" } as PropertyDoc,
        ];

        // Initialize refs at the test level
        guestsRef = ref<GuestsState>({
            data: guestsData,
            pending: false,
        });

        refsMap = new Map();
        refsMap.set("org1", guestsRef);
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
                    auth: authState,
                    guests: {
                        refsMap,
                        unsubMap: new Map(),
                        guestsCache: new Map(),
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

    async function closeBottomDialog(screen: RenderResult<PageAdminGuestsProps>): Promise<void> {
        await userEvent.click(screen.getByLabelText("Close bottom dialog"));
        await nextTick();
        try {
            await vi.waitUntil(() => document.querySelector(".q-dialog") === null);
        } catch (e) {
            // Empty catch block to prevent test failure
        }
    }

    it("renders correctly when there are guests", async () => {
        const screen = await render();

        await expect
            .element(screen.getByRole("heading", { name: "Guests (3)", exact: true }))
            .toBeVisible();
        await expect.element(screen.getByText("John Doe")).toBeVisible();
        await expect.element(screen.getByText("Jane Smith")).toBeVisible();
        await expect.element(screen.getByText("Alice Johnson")).toBeVisible();

        const percentage = screen.getByText("0.00%");
        expect(percentage.elements()).toHaveLength(3);

        const arrived = screen.getByText("Arrived: 0");
        expect(arrived.elements()).toHaveLength(3);
    });

    it("shows 'No guests data' when there are no guests", async () => {
        guestsRef.value.data = [];

        const screen = await render();

        await expect.element(screen.getByText("No guests data")).toBeInTheDocument();
    });

    it("opens the add new guest dialog when plus button is clicked", async () => {
        const screen = await render();

        const addButton = screen.getByLabelText("Add new guest");
        await userEvent.click(addButton);

        await nextTick();

        const dialogTitle = screen.getByText(t("PageAdminGuests.createNewGuestDialogTitle"));
        await expect.element(dialogTitle).toBeVisible();

        await userEvent.click(screen.getByLabelText("Close dialog"));
    });

    describe("guest sorting and filtering", () => {
        describe("filtering by number of bookings and percentage", () => {
            it("renders guests sorted by number of visits", async () => {
                const screen = await render();

                const guestItems = screen.getByRole("listitem");

                expect(guestItems.elements()).toHaveLength(3);

                // First guest should be John Doe (3 visits)
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                // Second guest should be Jane Smith (1 visit)
                await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
                // Third guest should be Alice Johnson (0 visits)
                await expect.element(guestItems.nth(2)).toHaveTextContent("Alice Johnson");
            });

            it("sorts guests by number of visits and percentage when they have the same number of visits", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: false,
                                } as Visit,
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
                                visit3: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit4: {
                                    date: new Date("2023-08-21").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                ];

                const screen = await render();

                const guestItems = screen.getByRole("listitem");
                expect(guestItems.elements()).toHaveLength(2);

                // Jane Smith should be first (2 visits, 100% arrival rate)
                // John Doe should be second (2 visits, 50% arrival rate)
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.nth(1)).toHaveTextContent("John Doe");
            });

            it("prioritizes number of visits over percentage when different number of visits", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: false,
                                } as Visit,
                                visit3: {
                                    date: new Date("2023-10-06").getTime(),
                                    arrived: false,
                                } as Visit,
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
                                visit4: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit5: {
                                    date: new Date("2023-08-21").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                ];

                const screen = await render();

                const guestItems = screen.getByRole("listitem");
                expect(guestItems.elements()).toHaveLength(2);

                // John Doe should be first (3 visits, 33% arrival rate)
                // Jane Smith should be second (2 visits, 100% arrival rate)
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
            });

            it("sorts guests by percentage when percentage sort option is selected", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: false,
                                } as Visit,
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
                                visit3: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                ];

                const screen = await render();

                // Change to percentage sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                const percentageOption = screen.getByText("Percentage");
                await userEvent.click(percentageOption);

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Jane Smith should be first (100% arrival - 1/1)
                // John Doe should be second (50% arrival - 1/2)
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.nth(1)).toHaveTextContent("John Doe");
            });

            it("uses number of bookings as secondary sort when percentages are equal", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: true,
                                } as Visit,
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
                                visit3: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                ];

                const screen = await render();

                // Change to percentage sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                const percentageOption = screen.getByText("Percentage");
                await userEvent.click(percentageOption);

                const guestItems = screen.getByRole("listitem");

                await closeBottomDialog(screen);

                // Both have 100% arrival rate
                // John Doe should be first (100% with 2 visits)
                // Jane Smith should be second (100% with 1 visit)
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
            });

            it("places guests with no bookings at the end when sorting by percentage", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "jane@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Alice Johnson",
                        contact: "alice@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Change to percentage sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                const percentageOption = screen.getByText("Percentage");
                await userEvent.click(percentageOption);

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // John Doe should be first (has visits)
                // Jane and Alice (no visits) should be after, in their original order
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.last()).toHaveTextContent("Alice Johnson");
            });
        });

        describe("filtering by tag", () => {
            it("persists and loads tag filter selections", async () => {
                guestsRef.value.data = guestsRef.value.data.map((guest, index) => ({
                    ...guest,
                    tags: index === 0 ? ["vip", "regular"] : index === 1 ? ["vip"] : ["regular"],
                }));

                let screen = await render();
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByLabelText("Filter by tags"));
                // Select VIP tag
                await userEvent.click(screen.getByText("vip"));

                await closeBottomDialog(screen);

                screen.unmount();
                screen = await render();

                const guestItems = screen.getByRole("listitem");
                expect(guestItems.elements()).toHaveLength(2);

                // Should only show guests with VIP tag
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");
                await expect.element(screen.getByText("Bob Wilson")).not.toBeInTheDocument();
            });

            it("filters guests with multiple selected tags", async () => {
                guestsRef.value.data = guestsRef.value.data.map((guest, index) => ({
                    ...guest,
                    tags: index === 0 ? ["vip", "regular"] : index === 1 ? ["vip"] : ["regular"],
                }));

                const screen = await render();
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByLabelText("Filter by tags"));
                await userEvent.click(screen.getByText("vip"));
                await userEvent.click(screen.getByText("regular"));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");
                expect(guestItems.elements()).toHaveLength(1);

                // Should only show guest with both VIP and Regular tags
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(screen.getByText("Jane Smith")).not.toBeInTheDocument();
                await expect.element(screen.getByText("Bob Wilson")).not.toBeInTheDocument();
            });
        });

        describe("lastModified sorting", () => {
            it("sorts guests by lastModified timestamp in descending order", async () => {
                const now = Date.now();
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        // 1 second ago
                        lastModified: now - 1000,
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "jane@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        // most recent
                        lastModified: now,
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Bob Wilson",
                        contact: "bob@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        // 2 seconds ago
                        lastModified: now - 2000,
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Switch to lastModified sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Last Modified"));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Should be sorted by lastModified (most recent first)
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.nth(1)).toHaveTextContent("John Doe");
                await expect.element(guestItems.last()).toHaveTextContent("Bob Wilson");
            });

            it("handles guests without lastModified timestamp", async () => {
                const now = Date.now();
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        lastModified: now,
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "jane@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        // No lastModified
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Bob Wilson",
                        contact: "bob@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        lastModified: now - 1000,
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Switch to lastModified sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Last Modified"));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Should be sorted with undefined lastModified at the end
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Bob Wilson");
                await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");
            });

            it("maintains sort direction when switching to lastModified sort", async () => {
                const now = Date.now();
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        lastModified: now,
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        lastModified: now - 1000,
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);

                // Click "Descending" to toggle to ascending
                await userEvent.click(screen.getByText("Descending"));
                await userEvent.click(screen.getByText("Last Modified"));

                await closeBottomDialog(screen);

                // Should maintain ascending order with lastModified sort
                const guestItems = screen.getByRole("listitem");
                // older timestamp
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                // newer timestamp
                await expect.element(guestItems.last()).toHaveTextContent("John Doe");
            });
        });

        describe("sort direction", () => {
            it("toggles between ascending and descending order", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "+434324",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    },
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "+434324",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit3: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    },
                ];

                const screen = await render();

                // Open sort menu
                const sortButton = screen.getByRole("button", { name: "filter guests" });
                await userEvent.click(sortButton);

                // Toggle to ascending
                const directionButton = screen.getByText("Descending");
                await userEvent.click(directionButton);

                await closeBottomDialog(screen);

                let guestItems = screen.getByRole("listitem");

                // In ascending order, Jane (1 visit) should be first
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.last()).toHaveTextContent("John Doe");

                await userEvent.click(sortButton);

                // Toggle back to descending
                await userEvent.click(screen.getByText("Ascending"));

                await closeBottomDialog(screen);

                guestItems = screen.getByRole("listitem");

                // Back in descending order, John (2 visits) should be first
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");
            });

            it("maintains sort direction when changing sort option", async () => {
                // John: 2 bookings, 50% arrival (1/2)
                // Jane: 1 booking, 100% arrival (1/1)
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "+434324",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit1: {
                                    date: new Date("2023-10-01").getTime(),
                                    arrived: true,
                                } as Visit,
                                visit2: {
                                    date: new Date("2023-10-05").getTime(),
                                    arrived: false,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "+434324",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {
                            property1: {
                                visit3: {
                                    date: new Date("2023-08-20").getTime(),
                                    arrived: true,
                                } as Visit,
                            },
                        },
                    } as GuestDoc,
                ];

                const screen = await render();

                // Default state: descending order, sort by bookings
                let guestItems = screen.getByRole("listitem");

                // Verify descending order by bookings
                // John should be first (2 bookings)
                // Jane should be second (1 booking)
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");

                // Switch to percentage sort (still descending)
                const sortButton = screen.getByRole("button", { name: "filter guests" });
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Percentage"));

                await closeBottomDialog(screen);

                guestItems = screen.getByRole("listitem");

                // Verify descending order by percentage
                // Jane should be first (100% arrival rate)
                // John should be second (50% arrival rate)
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.last()).toHaveTextContent("John Doe");
            });
        });

        describe("name sorting", () => {
            it("sorts guests alphabetically by name", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "Charlie Brown",
                        contact: "charlie@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Alice Smith",
                        contact: "alice@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Bob Johnson",
                        contact: "bob@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Change to name sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Name", { exact: true }));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Should be sorted by name in descending order by default
                await expect.element(guestItems.first()).toHaveTextContent("Charlie Brown");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Bob Johnson");
                await expect.element(guestItems.last()).toHaveTextContent("Alice Smith");

                await userEvent.click(sortButton);

                // Toggle to ascending order
                await userEvent.click(screen.getByText("Descending"));

                await closeBottomDialog(screen);

                // Should now be in ascending order
                await expect.element(guestItems.first()).toHaveTextContent("Alice Smith");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Bob Johnson");
                await expect.element(guestItems.last()).toHaveTextContent("Charlie Brown");
            });

            it("maintains name sort when applying filters", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "Charlie Brown",
                        contact: "charlie@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                        tags: ["vip"],
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Alice Smith",
                        contact: "alice@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                        tags: ["vip"],
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Bob Johnson",
                        contact: "bob@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "maskedContact",
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Set name sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Name", { exact: true }));
                // Switch to ascending
                await userEvent.click(screen.getByText("Descending"));

                // Apply VIP tag filter
                await userEvent.click(screen.getByLabelText("Filter by tags"));
                await userEvent.click(screen.getByText("vip"));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Should show only VIP guests, still sorted by name
                expect(guestItems.elements()).toHaveLength(2);
                await expect.element(guestItems.first()).toHaveTextContent("Alice Smith");
                await expect.element(guestItems.last()).toHaveTextContent("Charlie Brown");
            });
        });

        describe("land sorting", () => {
            it("sorts guests by landcode from maskedContact", async () => {
                guestsRef.value.data = [
                    {
                        id: "guest1",
                        name: "John Doe",
                        contact: "john@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "+44xxxx1234",
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest2",
                        name: "Jane Smith",
                        contact: "jane@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "+1xxxx5678",
                        visitedProperties: {},
                    } as GuestDoc,
                    {
                        id: "guest3",
                        name: "Alice Johnson",
                        contact: "alice@example.com",
                        hashedContact: "hashedContact",
                        maskedContact: "+33xxxx9012",
                        visitedProperties: {},
                    } as GuestDoc,
                ];

                const screen = await render();

                // Change to land sort
                const sortButton = screen.getByLabelText("filter guests");
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Land"));

                await closeBottomDialog(screen);

                const guestItems = screen.getByRole("listitem");

                // Should be sorted by landcode in ascending order by default
                await expect.element(guestItems.first()).toHaveTextContent("John Doe");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Alice Johnson");
                await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");

                // Toggle to ascending order
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Descending"));

                await closeBottomDialog(screen);

                // Should now be in ascending order
                // +1 (US), +33 (France), +44 (UK)
                await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
                await expect.element(guestItems.nth(1)).toHaveTextContent("Alice Johnson");
                await expect.element(guestItems.last()).toHaveTextContent("John Doe");
            });
        });
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

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "Jane");
            // Debounced search
            await vi.advanceTimersByTimeAsync(301);

            // Only Jane Smith should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");
        });

        it("filters guests by contact based on search input", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "alice@example.com");
            await vi.advanceTimersByTimeAsync(301);

            // Only Alice Johnson should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            await expect.element(guestItems.last()).toHaveTextContent("Alice Johnson");
        });

        it("is case-insensitive when filtering guests", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "jOhN d");
            await vi.advanceTimersByTimeAsync(301);

            // Only John Doe should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            await expect.element(guestItems.last()).toHaveTextContent("John Doe");
        });

        it("shows multiple guests when search matches multiple entries", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "example.com");
            await vi.advanceTimersByTimeAsync(301);

            // All guests should be visible since all have contacts ending with example.com
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);
            await expect.element(guestItems.first()).toHaveTextContent("John Doe");
            await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
            await expect.element(guestItems.last()).toHaveTextContent("Alice Johnson");
        });

        it("shows 'No guests data' when search yields no results", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "NonExistentGuest");
            await vi.advanceTimersByTimeAsync(301);

            // No guests should be visible, show 'No guests data' message
            await expect
                .element(screen.getByText(t("PageAdminGuests.noGuestsData")))
                .toBeInTheDocument();
        });

        it("clears search input and shows all guests", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "Jane");
            await vi.advanceTimersByTimeAsync(301);

            // Only Jane Smith should be visible
            let guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");

            // Clear the search input
            const clearButton = screen.getByLabelText("Clear");
            await userEvent.click(clearButton);
            await vi.advanceTimersByTimeAsync(301);

            // All guests should be visible again
            guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);
        });
    });

    it("does not render search and filter controls when there are no guests", async () => {
        guestsRef.value.data = [];

        const screen = await render();

        await expect
            .element(screen.getByLabelText("Search by name or contact"))
            .not.toBeInTheDocument();
        await expect.element(screen.getByLabelText("Sort Guests")).not.toBeInTheDocument();
    });

    describe("user role-based guest filtering", () => {
        it("renders all guests for admin users", async () => {
            // Admin is default in the test setup
            guestsRef.value.data = [
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
            ];

            const screen = await render();

            await expect.element(screen.getByText("John Doe")).toBeVisible();
            await expect.element(screen.getByText("Jane Smith")).toBeVisible();
            await expect.element(screen.getByText("Alice Johnson")).toBeVisible();
        });

        it("renders only related guests for non-admin users", async () => {
            authState = {
                user: {
                    id: "user1",
                    name: "Test User",
                    email: "user@example.com",
                    username: "testuser",
                    role: Role.HOSTESS,
                    relatedProperties: ["property1"],
                    organisationId: "org1",
                    capabilities: undefined,
                },
            };

            guestsRef.value.data = [
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
            ];

            const screen = await render();

            // Check that John Doe is visible
            await expect.element(screen.getByText("John Doe")).toBeVisible();
            // Ensure that only property1 summary is displayed for John Doe
            expect(screen.getByText("Property One").elements()).toHaveLength(2);
            await expect.element(screen.getByText("Property Two:")).not.toBeInTheDocument();

            // Check that Jane Smith is visible
            await expect.element(screen.getByText("Jane Smith")).toBeVisible();

            // Ensure that Alice Johnson is not displayed
            await expect.element(screen.getByText("Alice Johnson")).not.toBeInTheDocument();
        });

        it("renders no guests for non-admin users with no related properties", async () => {
            authState = {
                user: {
                    id: "user2",
                    name: "No Property User",
                    email: "noproperty@example.com",
                    username: "nopropertyuser",
                    role: Role.HOSTESS,
                    relatedProperties: [],
                    organisationId: "org1",
                    capabilities: undefined,
                },
            };

            guestsRef.value.data = [
                {
                    id: "guest1",
                    name: "John Doe",
                    contact: "john@example.com",
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    visitedProperties: {
                        property1: {
                            visit1: { date: new Date("2023-10-01").getTime() } as Visit,
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
                        property2: {
                            visit2: { date: new Date("2023-10-05").getTime() } as Visit,
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
            ];

            const screen = await render();

            await expect.element(screen.getByText("John Doe")).not.toBeInTheDocument();
            await expect.element(screen.getByText("Jane Smith")).not.toBeInTheDocument();
            await expect.element(screen.getByText("Alice Johnson")).not.toBeInTheDocument();

            await expect.element(screen.getByText("No guests data")).toBeInTheDocument();
        });
    });

    describe("filter persistence", () => {
        beforeEach(() => {
            // Set up guests with clear sorting differences
            guestsRef.value.data = [
                {
                    id: "guest1",
                    name: "John Doe",
                    contact: "john@example.com",
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    visitedProperties: {
                        property1: {
                            visit1: {
                                date: new Date("2023-10-01").getTime(),
                                arrived: true,
                            } as Visit,
                            visit2: {
                                date: new Date("2023-10-05").getTime(),
                                arrived: false,
                            } as Visit,
                        },
                    },
                    // 1 second ago
                    lastModified: Date.now() - 1000,
                },
                {
                    id: "guest2",
                    name: "Jane Smith",
                    contact: "jane@example.com",
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    visitedProperties: {
                        property1: {
                            visit3: {
                                date: new Date("2023-08-20").getTime(),
                                arrived: true,
                            } as Visit,
                        },
                    },
                    // most recent
                    lastModified: Date.now(),
                },
                {
                    id: "guest3",
                    name: "Bob Wilson",
                    contact: "bob@example.com",
                    hashedContact: "hashedContact",
                    maskedContact: "maskedContact",
                    visitedProperties: {
                        property1: {
                            visit4: {
                                date: new Date("2023-07-01").getTime(),
                                arrived: true,
                            } as Visit,
                            visit5: {
                                date: new Date("2023-07-02").getTime(),
                                arrived: true,
                            } as Visit,
                            visit6: {
                                date: new Date("2023-07-03").getTime(),
                                arrived: true,
                            } as Visit,
                        },
                    },
                    // 2 seconds ago
                    lastModified: Date.now() - 2000,
                },
            ];
        });

        it("persists and loads sort option changes", async () => {
            // First render - change sort option
            let screen = await render();
            const sortButton = screen.getByLabelText("filter guests");
            await userEvent.click(sortButton);
            await userEvent.click(screen.getByText("Percentage"));

            await closeBottomDialog(screen);

            // Unmount and remount component
            screen.unmount();
            screen = await render();

            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);

            // Should be sorted by percentage in descending order:
            // Bob: 100% (3/3 visits)
            // Jane: 100% (1/1 visit)
            // John: 50% (1/2 visits)
            await expect.element(guestItems.first()).toHaveTextContent("Bob Wilson");
            await expect.element(guestItems.nth(1)).toHaveTextContent("Jane Smith");
            await expect.element(guestItems.last()).toHaveTextContent("John Doe");
        });

        it("persists and loads sort direction changes", async () => {
            // First render - change sort direction
            let screen = await render();
            const sortButton = screen.getByLabelText("filter guests");
            await userEvent.click(sortButton);
            await userEvent.click(screen.getByText("Descending"));

            await closeBottomDialog(screen);

            // Unmount and remount component
            screen.unmount();
            screen = await render();

            // Verify persisted sort direction
            await userEvent.click(screen.getByLabelText("filter guests"));
            await expect.element(screen.getByText("Ascending")).toBeInTheDocument();
            await closeBottomDialog(screen);

            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);

            // Should be sorted by bookings in ascending order:
            // Jane: 1 booking
            // John: 2 bookings
            // Bob: 3 bookings
            await expect.element(guestItems.first()).toHaveTextContent("Jane Smith");
            await expect.element(guestItems.nth(1)).toHaveTextContent("John Doe");
            await expect.element(guestItems.last()).toHaveTextContent("Bob Wilson");
        });

        it("maintains filter state across multiple changes", async () => {
            // First render - set multiple filters
            let screen = await render();

            // Change sort to lastModified
            const sortButton = screen.getByLabelText("filter guests");
            await userEvent.click(sortButton);
            await userEvent.click(screen.getByText("Last Modified"));
            // Change direction to ascending
            await userEvent.click(screen.getByText("Descending"));

            await closeBottomDialog(screen);

            // Unmount and remount component
            screen.unmount();
            screen = await render();

            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);

            // Should be sorted by lastModified in ascending order:
            // Bob (oldest)
            // John
            // Jane (newest)
            await expect.element(guestItems.first()).toHaveTextContent("Bob Wilson");
            await expect.element(guestItems.nth(1)).toHaveTextContent("John Doe");
            await expect.element(guestItems.last()).toHaveTextContent("Jane Smith");
        });
    });
});
