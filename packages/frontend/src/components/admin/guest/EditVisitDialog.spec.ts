import type { Visit } from "@firetable/types";
import type { RenderResult } from "vitest-browser-vue";
import type { EditVisitDialogProps } from "src/components/admin/guest/EditVisitDialog.vue";
import EditVisitDialog from "./EditVisitDialog.vue";
import { renderComponent, t } from "../../../../test-helpers/render-component";
import { describe, it, expect, beforeEach } from "vitest";
import { userEvent } from "@vitest/browser/context";

describe("EditVisitDialog", () => {
    let props: EditVisitDialogProps;

    beforeEach(() => {
        props = {
            visit: {
                date: Date.now(),
                eventName: "Test Event",
                arrived: false,
                cancelled: false,
                isVIPVisit: false,
            },
        };
    });

    function render(): RenderResult<EditVisitDialogProps> {
        return renderComponent(EditVisitDialog, props);
    }

    describe("toggle states", () => {
        it("handles arrived toggle", async () => {
            const screen = render();

            const arrivedToggle = screen.getByLabelText(t("Global.arrived"));
            await userEvent.click(arrivedToggle);
            await userEvent.click(screen.getByText(t("Global.submit")));

            expect(screen.emitted().update).toBeTruthy();
            expect(screen.emitted().update[0]).toEqual([
                expect.objectContaining({
                    arrived: true,
                    cancelled: false,
                }),
            ]);
        });

        it("handles cancelled toggle", async () => {
            const screen = render();

            const cancelledToggle = screen.getByLabelText(t("Global.cancelled"));
            await userEvent.click(cancelledToggle);
            await userEvent.click(screen.getByText(t("Global.submit")));

            expect(screen.emitted().update).toBeTruthy();
            expect(screen.emitted().update[0]).toEqual([
                expect.objectContaining({
                    arrived: false,
                    cancelled: true,
                }),
            ]);
        });

        it("handles VIP toggle", async () => {
            const screen = render();

            const vipToggle = screen.getByLabelText("VIP");
            await userEvent.click(vipToggle);
            await userEvent.click(screen.getByText(t("Global.submit")));

            expect(screen.emitted().update).toBeTruthy();
            expect(screen.emitted().update[0]).toEqual([
                expect.objectContaining({
                    isVIPVisit: true,
                }),
            ]);
        });

        it("makes arrived and cancelled mutually exclusive", async () => {
            const screen = render();

            // First set arrived to true
            const arrivedToggle = screen.getByLabelText(t("Global.arrived"));
            await userEvent.click(arrivedToggle);

            // Then try to set cancelled to true
            const cancelledToggle = screen.getByLabelText(t("Global.cancelled"));
            await userEvent.click(cancelledToggle);

            await userEvent.click(screen.getByText(t("Global.submit")));

            expect(screen.emitted().update).toBeTruthy();
            console.log(screen.emitted().update);
            const lastUpdate = screen.emitted<Visit[]>().update.slice(-1)[0][0];
            expect(lastUpdate).toEqual(
                expect.objectContaining({
                    arrived: false,
                    cancelled: true,
                }),
            );
        });
    });

    describe("initial state", () => {
        it("correctly displays initial visit state", async () => {
            props.visit = {
                date: Date.now(),
                eventName: "Test Event",
                arrived: true,
                cancelled: false,
                isVIPVisit: true,
            };

            const screen = render();

            const arrivedToggle = screen.getByLabelText(t("Global.arrived"));
            const cancelledToggle = screen.getByLabelText(t("Global.cancelled"));
            const vipToggle = screen.getByLabelText("VIP");

            await expect.element(arrivedToggle).toHaveAttribute("aria-checked", "true");
            await expect.element(cancelledToggle).toHaveAttribute("aria-checked", "false");
            await expect.element(vipToggle).toHaveAttribute("aria-checked", "true");
        });
    });
});
