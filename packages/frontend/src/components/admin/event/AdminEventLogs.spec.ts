import type { EventLog, EventLogsDoc } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";

import { AdminRole, Role } from "@firetable/types";
import { page } from "@vitest/browser/context";
import { formatEventDate, getDefaultTimezone } from "src/helpers/date-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

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

                const timelineEntryHandle = messageElement.element().closest(".v-timeline-item");
                const iconHandle = timelineEntryHandle!.querySelector(".v-icon");
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

    it("properly handles scroll to bottom button visibility", async () => {
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

        const scrollContainer = screen.container.querySelector(".logs-container") as HTMLElement;

        async function scrollToPercentage(percentage: number): Promise<void> {
            const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
            scrollContainer.scrollTop = maxScroll * percentage;
            scrollContainer.dispatchEvent(new Event("scroll", { bubbles: true }));
            await nextTick();
        }

        // Test 1: At top (0%) - button should not show
        await scrollToPercentage(0);
        await expect.element(screen.getByLabelText("Scroll to bottom")).not.toBeInTheDocument();
        // Test 2: At 30% - button should show
        await scrollToPercentage(0.3);
        await expect.element(screen.getByLabelText("Scroll to bottom")).toBeVisible();
        // Test 3: At 50% - button should still show
        await scrollToPercentage(0.5);
        await expect.element(screen.getByLabelText("Scroll to bottom")).toBeVisible();
        // Test 4: At 95% (bottom) - button should not show
        await scrollToPercentage(0.95);
        await expect.element(screen.getByLabelText("Scroll to bottom")).not.toBeInTheDocument();
        // Test 5: Back to middle - button should show again
        await scrollToPercentage(0.4);
        await expect.element(screen.getByLabelText("Scroll to bottom")).toBeVisible();
    });
});
