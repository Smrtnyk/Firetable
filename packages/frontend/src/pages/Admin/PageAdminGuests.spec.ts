import type { RenderResult } from "vitest-browser-vue";
import type { AppUser, GuestDoc, PropertyDoc, Visit } from "@firetable/types";
import type { PageAdminGuestsProps } from "./PageAdminGuests.vue";

import type { Ref } from "vue";
import PageAdminGuests from "./PageAdminGuests.vue";
import { renderComponent, t } from "../../../test-helpers/render-component";
import { ADMIN, Role } from "@firetable/types";
import { ref } from "vue";

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

const { createDialogSpy } = vi.hoisted(() => ({
    createDialogSpy: vi.fn(),
}));

vi.mock("src/composables/useDialog", () => ({
    useDialog: () => ({
        createDialog: createDialogSpy,
    }),
}));

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
        authState = {
            user: {
                id: "admin1",
                name: "Admin User",
                email: "admin@example.com",
                username: "adminuser",
                role: ADMIN,
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

        // call arguments
        const callArg = createDialogSpy.mock.calls[0][0];
        // Check that FTDialog is the component
        expect(callArg.component.__name).toBe("FTDialog");
        // Check the componentProps
        const props = callArg.componentProps;
        expect(props.title).toBe(t("PageAdminGuests.createNewGuestDialogTitle"));
        expect(props.maximized).toBe(false);
        expect(props.component.__name).toBe("AddNewGuestForm");
        expect(typeof props.listeners.create).toBe("function");
    });

    describe("guest sorting", () => {
        it("renders guests sorted by number of visits", async () => {
            const screen = await render();

            const guestItems = screen.getByRole("listitem");

            expect(guestItems.elements()).toHaveLength(3);

            // First guest should be John Doe (3 visits)
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            // Second guest should be Jane Smith (1 visit)
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
            // Third guest should be Alice Johnson (0 visits)
            expect(guestItems.elements()[2]).toHaveTextContent("Alice Johnson");
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
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
            expect(guestItems.elements()[1]).toHaveTextContent("John Doe");
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
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
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

            const guestItems = screen.getByRole("listitem");

            // Jane Smith should be first (100% arrival - 1/1)
            // John Doe should be second (50% arrival - 1/2)
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
            expect(guestItems.elements()[1]).toHaveTextContent("John Doe");
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

            // Both have 100% arrival rate
            // John Doe should be first (100% with 2 visits)
            // Jane Smith should be second (100% with 1 visit)
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
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

            const guestItems = screen.getByRole("listitem");

            // John Doe should be first (has visits)
            // Jane and Alice (no visits) should be after, in their original order
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
            expect(guestItems.elements()[2]).toHaveTextContent("Alice Johnson");
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

                let guestItems = screen.getByRole("listitem");

                // In ascending order, Jane (1 visit) should be first
                expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
                expect(guestItems.elements()[1]).toHaveTextContent("John Doe");

                // Toggle back to descending
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Ascending"));

                guestItems = screen.getByRole("listitem");

                // Back in descending order, John (2 visits) should be first
                expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
                expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
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
                expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
                expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");

                // Switch to percentage sort (still descending)
                const sortButton = screen.getByRole("button", { name: "filter guests" });
                await userEvent.click(sortButton);
                await userEvent.click(screen.getByText("Percentage"));

                guestItems = screen.getByRole("listitem");

                // Verify descending order by percentage
                // Jane should be first (100% arrival rate)
                // John should be second (50% arrival rate)
                expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
                expect(guestItems.elements()[1]).toHaveTextContent("John Doe");
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
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");
        });

        it("filters guests by contact based on search input", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "alice@example.com");
            await vi.advanceTimersByTimeAsync(301);

            // Only Alice Johnson should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("Alice Johnson");
        });

        it("is case-insensitive when filtering guests", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "jOhN d");
            await vi.advanceTimersByTimeAsync(301);

            // Only John Doe should be visible
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(1);
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
        });

        it("shows multiple guests when search matches multiple entries", async () => {
            const screen = await render();

            const searchInput = screen.getByLabelText("Search by name or contact");
            await userEvent.type(searchInput, "example.com");
            await vi.advanceTimersByTimeAsync(301);

            // All guests should be visible since all have contacts ending with example.com
            const guestItems = screen.getByRole("listitem");
            expect(guestItems.elements()).toHaveLength(3);
            expect(guestItems.elements()[0]).toHaveTextContent("John Doe");
            expect(guestItems.elements()[1]).toHaveTextContent("Jane Smith");
            expect(guestItems.elements()[2]).toHaveTextContent("Alice Johnson");
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
            expect(guestItems.elements()[0]).toHaveTextContent("Jane Smith");

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
});
