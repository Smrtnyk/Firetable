import type { CallableRequest } from "firebase-functions/v2/https";
import { createPropertyFn } from "./create-property.js";
import { getPropertyPath, getUserPath, getUsersPath } from "../../paths.js";
import { db } from "../../init.js";
import { describe, expect, it } from "vitest";

describe("createPropertyFn", () => {
    function mockRequest<T>(data: T, auth: any): CallableRequest<T> {
        return {
            data,
            auth,
            rawRequest: {} as any,
        };
    }

    it("should throw error if user is not authenticated", async () => {
        const request = mockRequest({ name: "Test Property", organisationId: "org1" }, null);

        await expect(createPropertyFn(request)).rejects.toThrow("User must be authenticated");
    });

    it("should throw error if organisationId is missing", async () => {
        const request = mockRequest({ name: "Test Property" }, { uid: "user123", token: {} });

        // @ts-expect-error -- not passing organisationId
        await expect(createPropertyFn(request)).rejects.toThrow(
            "organisationId is missing in property payload",
        );
    });

    it("should create a property and update user and property data", async () => {
        const organisationId = "org1";
        const userId = "user123";
        const roleName = "user";
        const propertyName = "Test Property";

        // Create the user document in Firestore
        const userData = {
            name: "Test User",
            role: roleName,
            relatedProperties: [],
        };
        await db.collection(getUsersPath(organisationId)).doc(userId).set(userData);

        const request = mockRequest(
            { name: propertyName, organisationId },
            { uid: userId, token: { role: roleName } },
        );
        const propertyId = await createPropertyFn(request);

        expect(propertyId).toBeDefined();

        // Check if the property data is correctly stored
        const propertyData = await db.doc(getPropertyPath(organisationId, propertyId)).get();
        expect(propertyData.data()).toStrictEqual({
            name: propertyName,
            organisationId,
            creatorId: userId,
        });

        // Check if the user's related properties are updated
        const updatedUserData = await db.doc(getUserPath(organisationId, userId)).get();
        expect(updatedUserData.data()?.relatedProperties).toContain(propertyId);
    });
});
