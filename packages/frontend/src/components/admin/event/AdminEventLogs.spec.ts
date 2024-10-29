import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import type { AdminEventLogsProps } from "./AdminEventLogs.vue";
import AdminEventLogs from "./AdminEventLogs.vue";
import { renderComponent, locale } from "../../../../test-helpers/render-component";
import { ADMIN, Role } from "@firetable/types";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { page } from "@vitest/browser/context";

const sampleLogs: EventLog[] = [
    {
        message: "User John Doe created a reservation.",
        creator: {
            id: "foo",
            name: "John Doe",
            email: "john@example.com",
            role: Role.MANAGER,
        },
        timestamp: 1_633_017_600_000,
    },
    {
        message: "Admin deleted a reservation.",
        creator: {
            id: "bar",
            name: "Admin",
            email: "admin@example.com",
            role: ADMIN,
        },
        timestamp: 1_633_104_000_000,
    },
    {
        message: "User Jane Smith edited a reservation.",
        creator: {
            id: "baz",
            name: "Jane Smith",
            email: "jane@example.com",
            role: Role.STAFF,
        },
        timestamp: 1_633_190_400_000,
    },
];

const logsDoc: EventLogsDoc = {
    logs: sampleLogs,
};

function getIconNameForLogEntry(logMessage: string): string {
    if (logMessage.includes("deleted")) {
        return "trash";
    }

    if (logMessage.includes("transferred")) {
        return "transfer";
    }

    if (logMessage.includes("created")) {
        return "plus";
    }

    if (logMessage.includes("edited")) {
        return "pencil";
    }

    if (logMessage.includes("copied")) {
        return "copy";
    }

    return "";
}

describe("AdminEventLogs", () => {
    let screen: RenderResult<AdminEventLogsProps>;

    describe("when user is admin", () => {
        beforeEach(() => {
            screen = renderComponent(AdminEventLogs, {
                logsDoc,
                isAdmin: true,
                timezone: getDefaultTimezone(),
            });
        });

        it("renders all logs", () => {
            sampleLogs.forEach((log) => {
                const messageElement = page.getByText(log.message);
                expect(messageElement.elements().length).toBeTruthy();
            });
        });

        it("displays correct icons for log messages", async () => {
            for (const log of sampleLogs) {
                const expectedIconName = getIconNameForLogEntry(log.message);

                const messageElement = page.getByText(log.message);
                await expect.element(messageElement).toBeVisible();

                const timelineEntryHandle = messageElement.element().closest(".q-timeline__entry");
                const iconHandle = timelineEntryHandle!.querySelector(".q-icon");

                if (expectedIconName) {
                    const iconName = iconHandle!.innerHTML;
                    expect(iconName).toContain(expectedIconName);
                } else {
                    expect(iconHandle).toBeNull();
                }
            }
        });

        it("formats subtitles correctly", async () => {
            for (const log of sampleLogs) {
                const datePart = formatEventDate(
                    log.timestamp as number,
                    locale.value,
                    getDefaultTimezone(),
                );
                const userPart = `${log.creator.name} (${log.creator.email})`;
                const expectedSubtitle = `${datePart}, by ${userPart}`;

                const subtitleElement = page.getByText(expectedSubtitle);
                await expect.element(subtitleElement).toBeVisible();
            }
        });
    });

    describe("when user is not admin", () => {
        beforeEach(() => {
            screen = renderComponent(AdminEventLogs, {
                logsDoc,
                isAdmin: false,
                timezone: getDefaultTimezone(),
            });
        });

        it("filters out logs created by admins", async () => {
            const nonAdminLogs = sampleLogs.filter((log) => log.creator.role !== ADMIN);

            // Verify that non-admin logs are displayed
            for (const log of nonAdminLogs) {
                const messageElement = page.getByText(log.message);
                await expect.element(messageElement).toBeVisible();
            }

            // Verify that admin logs are not displayed
            const adminLog = sampleLogs.find(function (log) {
                return log.creator.role === ADMIN;
            });
            const adminMessage = adminLog!.message;

            const elements = Array.from(document.querySelectorAll("*"));
            const adminElementExists = elements.some(function (element) {
                return element.textContent?.includes(adminMessage);
            });

            expect(adminElementExists).toBe(false);
        });
    });

    it('shows "Scroll to Bottom" button when scrolled away from top and bottom, and scrolls to bottom when button is clicked', async () => {
        const numberOfLogs = 50;
        const logs = Array.from(
            { length: numberOfLogs },
            (_, i) =>
                ({
                    message: `Log message ${i}`,
                    creator: {
                        id: Math.random().toString(),
                        name: `User ${i}`,
                        email: `user${i}@example.com`,
                        role: Role.STAFF,
                    },
                    timestamp: Date.now() - i * 1000,
                }) as EventLog,
        );

        screen = renderComponent(
            AdminEventLogs,
            {
                timezone: getDefaultTimezone(),
                logsDoc: { logs },
                isAdmin: true,
            },
            { wrapInLayout: true },
        );

        // Get the QScrollArea element
        const scrollAreaElement = screen.container.querySelector(".logs-container");
        expect(scrollAreaElement).toBeTruthy();

        // Get the scrolling element inside QScrollArea
        const scrollContentElement = scrollAreaElement!.querySelector(".q-scrollarea__container");
        expect(scrollContentElement).toBeTruthy();

        // Calculate the scrollable height
        const scrollableHeight =
            scrollContentElement!.scrollHeight - scrollContentElement!.clientHeight;

        // Set scrollTop to 30% of the scrollable height
        scrollContentElement!.scrollTop = scrollableHeight * 0.3;

        // Dispatch a scroll event to trigger handleScroll
        scrollContentElement!.dispatchEvent(new Event("scroll"));

        await new Promise((resolve) => {
            setTimeout(resolve, 222);
        });

        // Assert that the "Scroll to Bottom" button appears
        const scrollButton = document.querySelector<HTMLButtonElement>(".q-btn--fab");
        expect(scrollButton).toBeTruthy();
        scrollButton!.click();

        // Wait for the scroll animation to complete (animation duration is 1000ms)
        await new Promise((resolve) => {
            setTimeout(resolve, 1100);
        });

        // Dispatch a scroll event to update the component's state
        scrollContentElement!.dispatchEvent(new Event("scroll"));

        // Verify that scrollTop is at the bottom
        const isAtBottom =
            scrollContentElement!.scrollTop + scrollContentElement!.clientHeight >=
            scrollContentElement!.scrollHeight;
        expect(isAtBottom).toBe(true);

        // Assert that the "Scroll to Bottom" button disappears
        const scrollButtonAfterAppears = Boolean(document.querySelector(".q-btn--fab"));
        expect(scrollButtonAfterAppears).toBe(false);
    });
});
