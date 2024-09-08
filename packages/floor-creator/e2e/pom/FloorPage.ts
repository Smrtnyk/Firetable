import type { Page } from "@playwright/test";
import type { CheerioAPI } from "cheerio";
import { load } from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export abstract class FloorPage {
    goto: Page["goto"];
    EMPTY_PAGE = "http://test.local/empty.html";
    page: Page;
    bundleContent: string;
    dynamicHtmlContent = "";

    private readonly baseDir: string;

    constructor(page: Page) {
        const filename = fileURLToPath(import.meta.url);
        const dirname = path.dirname(filename);

        this.page = page;
        this.baseDir = path.resolve(dirname, "../routes");
        this.bundleContent = fs.readFileSync(
            path.resolve(dirname, "../../dist-esbuild/bundle.js"),
            "utf8",
        );

        this.goto = this.page.goto.bind(this.page);
    }

    /**
     * Method for tests to set the dynamic HTML content that will be injected into the page.
     * @param content - The dynamic HTML content to set.
     */
    setDynamicHtmlContent(content: string): this {
        this.dynamicHtmlContent = content;
        return this;
    }

    async initRoutes(): Promise<void> {
        await this.page.route("**/*", (route) => {
            const request = route.request();
            const reqPathname = new URL(request.url()).pathname;
            const filePath = path.join(this.baseDir, reqPathname);

            if (fs.existsSync(filePath)) {
                if (filePath.endsWith(".html")) {
                    const htmlContent = fs.readFileSync(filePath, "utf8");
                    const $ = load(htmlContent);
                    $("body").append(`<script>${this.bundleContent}</script>`);
                    this.#injectDynamicContent($);

                    return route.fulfill({
                        status: 200,
                        body: $.html(),
                        contentType: "text/html",
                    });
                }
                const fileContent = fs.readFileSync(filePath);
                return route.fulfill({
                    status: 200,
                    body: fileContent,
                });
            }

            // Return a 404 response if the file is not found
            return route.fulfill({
                status: 404,
                body: "File not found",
            });
        });
    }

    /**
     * Injects dynamic HTML content after the bundled script in the <body>.
     * @param $ - The cheerio instance of the current HTML
     */
    #injectDynamicContent($: CheerioAPI): void {
        if (this.dynamicHtmlContent) {
            $("body").append(this.dynamicHtmlContent);
        }
    }
}
