import type { TestingOptions } from "@pinia/testing";
import type { Plugin } from "vue";
import { config } from "@vue/test-utils";
import { beforeAll, afterAll, vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { Quasar } from "quasar";

export function installPinia(options?: Partial<TestingOptions>): void {
    const globalConfigBackup = structuredClone(config.global);

    beforeAll(() => {
        config.global.plugins.unshift(
            Quasar,
            // This is needed because typescript will complain otherwise
            // Probably due to this being a monorepo as this same setup inside a test project did work correctly
            createTestingPinia({
                ...options,
                createSpy: vi.fn,
            }) as unknown as Plugin,
        );
    });

    afterAll(() => {
        config.global = globalConfigBackup;
    });
}
