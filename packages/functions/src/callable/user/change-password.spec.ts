import type { CallableRequest } from "firebase-functions/v2/https";
import { changePasswordFn } from "./change-password.js";
import * as Init from "../../init.js";
import { MockAuth } from "../../../test-helpers/MockAuth.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("changePasswordFn", () => {
    let mockAuth: MockAuth;

    beforeEach(() => {
        mockAuth = new MockAuth();
        vi.spyOn(Init, "auth", "get").mockReturnValue(mockAuth as any);
    });

    it("should throw error if user is unauthenticated", async () => {
        const req = {
            auth: null as any,
            data: { newPassword: "newPassword123" },
            rawRequest: {} as any,
        } as CallableRequest<{ newPassword: string }>;

        await expect(changePasswordFn(req)).rejects.toThrow(
            "The function must be called while authenticated.",
        );
    });

    it("should throw error for invalid password", async () => {
        const testUser = { email: "test@example.com", password: "dsad" };
        const { uid } = await mockAuth.createUser(testUser);

        const req = {
            auth: { uid },
            data: { newPassword: "123" },
        } as CallableRequest<{ newPassword: string }>;

        await expect(changePasswordFn(req)).rejects.toThrow(
            "Password must be at least 6 characters long!",
        );
    });

    it("should change the password successfully", async () => {
        const testUser = { email: "test@example.com", password: "dsad" };
        const { uid } = await mockAuth.createUser(testUser);

        const req = {
            auth: { uid },
            data: { newPassword: "newPassword123" },
        } as CallableRequest<{ newPassword: string }>;

        const response = await changePasswordFn(req);
        expect(response).toEqual({ success: true });
    });
});
