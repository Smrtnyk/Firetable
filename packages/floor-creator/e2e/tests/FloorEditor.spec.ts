import { test, expect } from "../base.js";

test.describe("FloorEditorPage Tests", () => {
    test("should navigate to the editor page", async ({ floorEditorPage }) => {
        await floorEditorPage.goto(floorEditorPage.EMPTY_PAGE);

        await expect(floorEditorPage.page).toHaveURL(floorEditorPage.EMPTY_PAGE);
        expect(await floorEditorPage.page.title()).toContain("Empty HTML Page");
    });
});
