import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: "./tests",

    // Run all tests in parallel.
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: Boolean(process.env.CI),

    // Reporter to use
    reporter: "html",

    use: {
        screenshot: "only-on-failure",
    },
    // Configure projects for major browsers.
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
