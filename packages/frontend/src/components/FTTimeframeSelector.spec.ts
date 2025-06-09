import type { DateRange } from "src/types";

import { userEvent } from "@vitest/browser/context";
import { last } from "es-toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FTTimeframeSelectorProps } from "./FTTimeframeSelector.vue";

import { renderComponent } from "../../test-helpers/render-component";
import FTTimeframeSelector from "./FTTimeframeSelector.vue";

describe("FTTimeframeSelector.vue", () => {
    let props: Partial<FTTimeframeSelectorProps>;
    let screen: ReturnType<typeof renderComponent<FTTimeframeSelectorProps>>;

    const FIXED_DATE = new Date("2024-01-15T00:00:00.000Z");

    beforeEach(() => {
        vi.setSystemTime(FIXED_DATE);

        props = {
            modelValue: { from: "", to: "" },
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        if (screen) {
            screen.unmount();
        }
    });

    describe("Rendering", () => {
        it("renders the component with VDateInput and preset chips", async () => {
            screen = renderComponent(FTTimeframeSelector, props, {
                includeGlobalComponents: true,
                wrapInLayout: true,
            });
            const dateInput = screen.getByRole("textbox", { name: "Select date range" });
            await expect.element(dateInput).toBeVisible();

            await expect.element(screen.getByText("Today")).toBeVisible();
            await expect.element(screen.getByText("Yesterday")).toBeVisible();
            await expect.element(screen.getByText("Last 7 Days")).toBeVisible();
            await expect.element(screen.getByText("Last 30 Days")).toBeVisible();
        });
    });

    describe("Preset Chip Selection", () => {
        const presetCases = [
            {
                chipText: "Today",
                expectedRange: { from: "2024-01-15", to: "2024-01-15" },
            },
            {
                chipText: "Yesterday",
                expectedRange: { from: "2024-01-14", to: "2024-01-14" },
            },
            {
                chipText: "Last 7 Days",
                expectedRange: { from: "2024-01-09", to: "2024-01-15" },
            },
            {
                chipText: "Last 30 Days",
                expectedRange: { from: "2023-12-17", to: "2024-01-15" },
            },
        ];

        it.each(presetCases)(
            "selecting preset '$chipText' emits correct date range",
            async ({ chipText, expectedRange }) => {
                screen = renderComponent(FTTimeframeSelector, props);
                const chip = screen.getByText(chipText);
                await userEvent.click(chip);

                const emitted = screen.emitted()["update:modelValue"] as DateRange[][];
                expect(emitted).toBeTruthy();
                expect(last(emitted)![0]).toEqual(expectedRange);
            },
        );
    });

    describe("Custom Date Range Selection", () => {
        beforeEach(() => {
            props.modelValue = { from: "2024-01-05", to: "2024-01-07" };
            screen = renderComponent(FTTimeframeSelector, props);
        });

        it("allows selecting a valid date range and emits the correct event", async () => {
            const dateInput = screen.getByRole("textbox", { name: "Select date range" });
            await userEvent.click(dateInput);

            const day1Button = screen.getByRole("button", { exact: true, name: "1" }).first();
            await userEvent.click(day1Button);

            const day10Button = screen.getByRole("button", { exact: true, name: "10" }).first();
            await userEvent.click(day10Button);

            const emitted = screen.emitted()["update:modelValue"];
            expect(emitted).toBeTruthy();
            expect(emitted![emitted!.length - 1]).toEqual([
                { from: "2024-01-01", to: "2024-01-10" },
            ]);
        });

        it("clears the date range when the VDateInput clear button is clicked", async () => {
            props.modelValue = { from: "2024-01-01", to: "2024-01-10" };
            screen.unmount();
            screen = renderComponent(FTTimeframeSelector, props);

            const clearButton = screen.getByRole("button", { name: /clear/i });
            await userEvent.click(clearButton);

            const emitted = screen.emitted()["update:modelValue"];
            expect(emitted).toBeTruthy();
            expect(emitted![emitted!.length - 1]).toEqual([{ from: "", to: "" }]);
        });
    });

    describe("Validation and Rules", () => {
        it("disables buttons before start date", async () => {
            screen = renderComponent(FTTimeframeSelector, props);
            const dateInput = screen.getByRole("textbox", { name: "Select date range" });
            await userEvent.click(dateInput);

            const day10Button = screen.getByRole("button", { exact: true, name: "10" }).first();
            await userEvent.click(day10Button);

            const day1Button = screen.getByRole("button", { exact: true, name: "1" }).first();
            await expect.element(day1Button).toBeDisabled();
        });

        it("disables buttons over date range for maxDays", async () => {
            props.maxDays = 5;
            screen = renderComponent(FTTimeframeSelector, props);
            const dateInput = screen.getByRole("textbox", { name: "Select date range" });
            await userEvent.click(dateInput);

            const day1Button = screen.getByRole("button", { exact: true, name: "1" }).first();
            await userEvent.click(day1Button);

            const day7Button = screen.getByRole("button", { exact: true, name: "7" }).first();
            await expect.element(day7Button).toBeDisabled();
        });

        it("disables dates in picker that would exceed maxDays when selecting the second date", async () => {
            props.maxDays = 3;
            screen = renderComponent(FTTimeframeSelector, props);
            const dateInput = screen.getByRole("textbox", { name: "Select date range" });
            await userEvent.click(dateInput);

            const day1Button = screen.getByRole("button", { exact: true, name: "1" }).first();
            await userEvent.click(day1Button);

            // Max end date is Jan 3rd. So, Jan 4th should be disabled.
            const day4Button = screen.getByRole("button", { exact: true, name: "4" }).first();
            await expect.element(day4Button).toBeDisabled();

            const day3Button = screen.getByRole("button", { exact: true, name: "3" }).first();
            await expect.element(day3Button).not.toBeDisabled();
        });
    });
});
