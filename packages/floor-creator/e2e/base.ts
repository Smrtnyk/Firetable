import { FloorEditorPage } from "./pom/FloorEditorPage.js";
import { FloorViewerPage } from "./pom/FloorViewerPage.js";
import { test as baseTest } from "@playwright/test";

type FloorFixtures = {
    floorEditorPage: FloorEditorPage;
    floorViewerPage: FloorViewerPage;
};

export const test = baseTest.extend<FloorFixtures>({
    floorEditorPage: async ({ page }, use) => {
        const editorPage = new FloorEditorPage(page);
        await editorPage.initRoutes();
        await use(editorPage);
    },

    floorViewerPage: async ({ page }, use) => {
        const viewerPage = new FloorViewerPage(page);
        await viewerPage.initRoutes();
        await use(viewerPage);
    },
});

export { expect } from "@playwright/test";
