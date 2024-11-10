import { hashString } from "./hash-string";
import { describe, it, expect } from "vitest";

describe("hashString", () => {
    it("returns the correct hash for a given string", async () => {
        expect(await hashString("test")).toBe(
            "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        );
        expect(await hashString("hello")).toBe(
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
        );
        expect(await hashString("world")).toBe(
            "486ea46224d1bb4fb680f34f7c9ad96a8f24ec88be73ea8e5a6c65260e9cb8a7",
        );
        expect(await hashString("")).toBe(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        );
    });

    it("produces the same hash for the same input consistently", async () => {
        const inputs = ["consistent", "hashing", "function", "test123"];
        for (const input of inputs) {
            const firstHash = await hashString(input);
            const secondHash = await hashString(input);
            const thirdHash = await hashString(input);
            expect(firstHash).toBe(secondHash);
            expect(secondHash).toBe(thirdHash);
        }
    });

    it("produces different hashes for different inputs", async () => {
        const input1 = "inputOne";
        const input2 = "inputTwo";
        const input3 = "inputThree";

        const hash1 = await hashString(input1);
        const hash2 = await hashString(input2);
        const hash3 = await hashString(input3);

        expect(hash1).not.toBe(hash2);
        expect(hash2).not.toBe(hash3);
        expect(hash1).not.toBe(hash3);
    });

    it("handles special characters correctly", async () => {
        expect(await hashString("!@#$%^&*()")).toBe(
            "95ce789c5c9d18490972709838ca3a9719094bca3ac16332cfec0652b0236141",
        );
        expect(await hashString("😀😃😄😁")).toBe(
            "d90c5e46d1d0de7bfa1a40922803cd620199899df3a00713383a264d404740cf",
        );
        expect(await hashString("こんにちは")).toBe(
            "125aeadf27b0459b8760c13a3d80912dfa8a81a68261906f60d87f4a0268646c",
        );
    });

    it("is case-sensitive", async () => {
        expect(await hashString("Test")).not.toBe(await hashString("test"));
        expect(await hashString("HELLO")).not.toBe(await hashString("hello"));
    });

    it("handles long strings efficiently", async () => {
        const longString = "a".repeat(1000);
        const expectedHash = "41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3";
        expect(await hashString(longString)).toBe(expectedHash);
    });

    it("returns consistent hashes for similar strings", async () => {
        expect(await hashString("similar")).toBe(
            "00a9e08ce4c65c4c2471400864efd473d89a4e4f3a16bcce4346f2ed61e659ff",
        );
        expect(await hashString("similar1")).toBe(
            "b1d94a6787cd029182ef8227b48f5eebe8e885786826fafcef5644508df454a7",
        );
        expect(await hashString("similar!")).toBe(
            "a8bf8469e2d2db34c599747bfe86d3200c6006c6f17835ed714233510fd4ea91",
        );
    });
});
