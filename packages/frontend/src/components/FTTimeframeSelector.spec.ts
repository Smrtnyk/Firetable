import type { FTTimeframeSelectorProps } from "./FTTimeframeSelector.vue";
import FTTimeframeSelector from "./FTTimeframeSelector.vue";
import { renderComponent } from "../../test-helpers/render-component";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("TimeframeSelector.vue", () => {
    let props: FTTimeframeSelectorProps;
    let screen: ReturnType<typeof renderComponent<FTTimeframeSelectorProps>>;

    const FIXED_DATE = new Date("2024-01-15T00:00:00.000Z");

    beforeEach(() => {
        vi.setSystemTime(FIXED_DATE);

        props = {
            modelValue: { startDate: "", endDate: "" },
            presets: [
                { label: "Today", value: "today" },
                { label: "Yesterday", value: "yesterday" },
                { label: "Last 7 Days", value: "last7" },
                { label: "Last 30 Days", value: "last30" },
                { label: "Custom", value: "custom" },
            ],
            minDate: "2000-01-01",
            maxDate: "2050-12-31",
        };
        screen = renderComponent(FTTimeframeSelector, props);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Rendering", () => {
        it("renders the component with default props", async () => {
            const select = screen.getByText("Select Timeframe", { exact: true });

            await expect.element(select).toBeVisible();
        });

        it("displays all preset options", async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            for (const preset of props.presets!) {
                await expect.element(screen.getByText(preset.label)).toBeVisible();
            }
        });
    });

    describe("Preset Selection", () => {
        it.each([
            {
                preset: "today",
                expectedRange: {
                    startDate: "2024-01-15",
                    endDate: "2024-01-15",
                },
            },
            {
                preset: "yesterday",
                expectedRange: {
                    startDate: "2024-01-14",
                    endDate: "2024-01-14",
                },
            },
            {
                preset: "Last 7 Days",
                expectedRange: {
                    startDate: "2024-01-09",
                    endDate: "2024-01-15",
                },
            },
            {
                preset: "Last 30 Days",
                expectedRange: {
                    startDate: "2023-12-17",
                    endDate: "2024-01-15",
                },
            },
        ])(
            "selecting preset '$preset' emits correct date range",
            async ({ preset, expectedRange }) => {
                const select = screen.getByLabelText("Select Timeframe");
                await userEvent.click(select);

                const option = screen.getByText(preset.charAt(0).toUpperCase() + preset.slice(1));
                await userEvent.click(option);

                const applyButton = screen.getByText("Apply");
                await userEvent.click(applyButton);

                expect(screen.emitted()["update:modelValue"]).toStrictEqual([[expectedRange]]);
            },
        );

        it("selecting 'Custom' preset opens the date range picker", async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            const customOption = screen.getByText("Custom");
            await userEvent.click(customOption);

            const datePicker = screen.getByRole("dialog");
            await expect.element(datePicker).toBeVisible();
        });
    });

    describe("Custom Date Range Selection", () => {
        beforeEach(async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            const customOption = screen.getByText("Custom");
            await userEvent.click(customOption);
        });

        it("allows selecting a valid date range and emits the correct event", async () => {
            const startDate = screen.getByRole("button", { name: "1", exact: true });
            await userEvent.click(startDate);

            const endDate = screen.getByRole("button", {
                name: "10",
                exact: true,
            });
            await userEvent.click(endDate);

            const applyButton = screen.getByLabelText("Apply custom date range");
            await expect.element(applyButton).not.toBeDisabled();
            await userEvent.click(applyButton);

            await userEvent.click(screen.getByText("Apply"));

            const expectedRange = { startDate: "2024-01-01", endDate: "2024-01-10" };
            expect(screen.emitted()["update:modelValue"]).toStrictEqual([[expectedRange]]);
        });

        it("disables the Apply button when the date range is invalid", async () => {
            const startDate = screen.getByRole("button", {
                name: "10",
                exact: true,
            });
            await userEvent.click(startDate);

            const applyButton = screen.getByLabelText("Apply custom date range");
            await expect.element(applyButton).toBeDisabled();
        });

        it("clears the date range when the clear button is clicked", async () => {
            const startDate = screen.getByRole("button", { name: "1", exact: true });
            await userEvent.click(startDate);

            const endDate = screen.getByRole("button", {
                name: "10",
                exact: true,
            });
            await userEvent.click(endDate);

            const clearButton = screen.getByRole("button", { name: "Clear custom date range" });
            await userEvent.click(clearButton);

            const selectedRange = screen.getByText("Select Timeframe", { exact: true });
            await expect.element(selectedRange).toBeVisible();
        });

        it("closes the date picker without applying changes when cancel is clicked", async () => {
            const startDate = screen.getByRole("button", { name: "1", exact: true });
            await userEvent.click(startDate);

            const endDate = screen.getByRole("button", {
                name: "10",
                exact: true,
            });
            await userEvent.click(endDate);

            const cancelButton = screen.getByLabelText("Cancel custom date range");
            await userEvent.click(cancelButton);

            const datePicker = screen.getByLabelText("Custom date range picker");
            await expect.element(datePicker).not.toBeInTheDocument();

            expect(screen.emitted()["update:modelValue"]).toBeUndefined();
        });
    });

    describe("Apply Button State", () => {
        it("enables the Apply button when a preset is selected and has changed", async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            const todayOption = screen.getByText("Today");
            await userEvent.click(todayOption);

            const applyButton = screen.getByText("Apply");
            await expect.element(applyButton).not.toBeDisabled();
        });

        it("disables the Apply button when the preset has not changed", async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            const todayOption = screen.getByText("Today");
            await userEvent.click(todayOption);

            const applyButton = screen.getByRole("button", { name: "Apply" });
            await userEvent.click(applyButton);

            await expect.element(applyButton).toBeDisabled();
        });

        it("enables the Apply button when a custom date range is valid and has changed", async () => {
            const select = screen.getByLabelText("Select Timeframe");
            await userEvent.click(select);

            const customOption = screen.getByText("Custom");
            await userEvent.click(customOption);

            const startDate = screen.getByRole("button", { name: "1", exact: true });
            await userEvent.click(startDate);

            const endDate = screen.getByRole("button", {
                name: "10",
                exact: true,
            });
            await userEvent.click(endDate);

            const applyButton = screen.getByRole("button", { name: "Apply custom date range" });
            await expect.element(applyButton).not.toBeDisabled();
        });
    });
});