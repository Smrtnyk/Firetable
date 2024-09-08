import { test, expect } from "../base.js";

test.describe("FloorEditorPage Tests", () => {
    test("should navigate to the editor page", async ({ floorEditorPage }) => {
        await floorEditorPage
            .setDynamicHtmlContent(
                `
                <canvas id="floor-editor" />
                <script>
                    globalThis.addEventListener("DOMContentLoaded", () => {
                        const floorEditor = new globalThis.FT.FloorEditor({
                            canvas: document.getElementById("floor-editor"),
                            floorDoc: {},
                            containerWidth: document.body.clientWidth,
                        });
                    });
                </script>
            `,
            )
            .goto(floorEditorPage.EMPTY_PAGE);
        await floorEditorPage.page.pause();
        await expect(floorEditorPage.page).toHaveURL(floorEditorPage.EMPTY_PAGE);
        expect(await floorEditorPage.page.title()).toContain("Empty HTML Page");
    });
});
