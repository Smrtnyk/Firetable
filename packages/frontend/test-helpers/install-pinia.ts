import type { TestingOptions } from "@pinia/testing";
import { config } from "@vue/test-utils";
import { beforeAll, afterAll, vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { Quasar } from "quasar";

export function installPinia(options?: Partial<TestingOptions>): void {
    const globalConfigBackup = structuredClone(config.global);

    beforeAll(() => {
        config.global.plugins.unshift(
            Quasar,
            createTestingPinia({
                ...options,
                createSpy: vi.fn,
            }),
        );
    });

    afterAll(() => {
        config.global = globalConfigBackup;
    });
}
