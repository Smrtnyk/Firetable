import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { AdminRole, Role } from "@firetable/types";
import { page } from "@vitest/browser/context";
import { delay } from "es-toolkit";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { beforeEach, describe, expect, it } from "vitest";

import type { AdminEventLogsProps } from "./AdminEventLogs.vue";

import { getLocaleForTest, renderComponent } from "../../../../test-helpers/render-component";
import AdminEventLogs from "./AdminEventLogs.vue";

const sampleLogs: EventLog[] = [
    {
        creator: {
            email: "john@example.com",
            id: "foo",
            name: "John Doe",
            role: Role.MANAGER,
        },
        message: "User John Doe created a reservation.",
        timestamp: 1_633_017_600_000,
    },
    {
        creator: {
            email: "admin@example.com",
            id: "bar",
            name: "Admin",
            role: AdminRole.ADMIN,
        },
        message: "Admin deleted a reservation.",
        timestamp: 1_633_104_000_000,
    },
    {
        creator: {
            email: "jane@example.com",
            id: "baz",
            name: "Jane Smith",
            role: Role.STAFF,
        },
        message: "User Jane Smith edited a reservation.",
        timestamp: 1_633_190_400_000,
    },
];

const logsDoc: EventLogsDoc = {
    logs: sampleLogs,
};

function getIconNameForLogEntry(logMessage: string): string {
    if (logMessage.includes("deleted")) {
        return "fa fa-trash";
    }

    if (logMessage.includes("transferred")) {
        return "fa fa-exchange";
    }

    if (logMessage.includes("created")) {
        return "fa fa-plus";
    }

    if (logMessage.includes("edited")) {
        return "fa fa-pencil";
    }

    if (logMessage.includes("copied")) {
        return "fa fa-copy";
    }

    return "";
}

describe("AdminEventLogs", () => {
    let screen: RenderResult<AdminEventLogsProps>;

    describe("when user is admin", () => {
        beforeEach(() => {
            screen = renderComponent(AdminEventLogs, {
                isAdmin: true,
                logsDoc,
                timezone: getDefaultTimezone(),
            });
        });

        it("renders all logs", () => {
            sampleLogs.forEach((log) => {
                const messageElement = page.getByText(log.message);
                expect(messageElement.all().length).toBeGreaterThan(0);
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
                    const hasName = iconHandle!.className.includes(expectedIconName);
                    expect(hasName).toBe(true);
                } else {
                    expect(iconHandle).toBeNull();
                }
            }
        });

        it("formats subtitles correctly", async () => {
            for (const log of sampleLogs) {
                const datePart = formatEventDate(
                    log.timestamp as number,
                    getLocaleForTest().value,
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
                isAdmin: false,
                logsDoc,
                timezone: getDefaultTimezone(),
            });
        });

        it("filters out logs created by admins", async () => {
            const nonAdminLogs = sampleLogs.filter((log) => log.creator.role !== AdminRole.ADMIN);

            // Verify that non-admin logs are displayed
            for (const log of nonAdminLogs) {
                const messageElement = page.getByText(log.message);
                await expect.element(messageElement).toBeVisible();
            }

            // Verify that admin logs are not displayed
            const adminLog = sampleLogs.find(function (log) {
                return log.creator.role === AdminRole.ADMIN;
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
                    creator: {
                        email: `user${i}@example.com`,
                        id: Math.random().toString(),
                        name: `User ${i}`,
                        role: Role.STAFF,
                    },
                    message: `Log message ${i}`,
                    timestamp: Date.now() - i * 1000,
                }) as EventLog,
        );

        screen = renderComponent(
            AdminEventLogs,
            {
                isAdmin: true,
                logsDoc: { logs },
                timezone: getDefaultTimezone(),
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

        await delay(222);

        // Assert that the "Scroll to Bottom" button appears
        const scrollButton = document.querySelector<HTMLButtonElement>(".q-btn--fab");
        expect(scrollButton).toBeTruthy();
        scrollButton!.click();

        // Wait for the scroll animation to complete (animation duration is 1000ms)
        await delay(1100);

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
