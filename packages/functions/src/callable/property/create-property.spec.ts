import type { CallableRequest } from "firebase-functions/v2/https";
import type { CreatePropertyPayload } from "@shared-types/property.js";
import { createPropertyFn } from "./create-property.js";
import { getPropertyPath, getUserPath, getUsersPath } from "../../paths.js";
import { db } from "../../init.js";
import { describe, expect, it } from "vitest";

describe("createPropertyFn", () => {
    function mockRequest(
        data: CreatePropertyPayload,
        auth: any,
    ): CallableRequest<CreatePropertyPayload> {
        return {
            data,
            auth,
            rawRequest: {} as any,
            acceptsStreaming: false,
        };
    }

    it("should throw error if user is not authenticated", async () => {
        const request = mockRequest(
            { name: "Test Property", organisationId: "org1", img: "" },
            null,
        );

        await expect(createPropertyFn(request)).rejects.toThrow("User must be authenticated");
    });

    it("should throw error if organisationId is missing", async () => {
        const request = mockRequest(
            // @ts-expect-error -- not passing organisationId
            { name: "Test Property", img: "" },
            { uid: "user123", token: {} },
        );

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
            { name: propertyName, organisationId, img: "" },
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
            img: "",
        });

        // Check if the user's related properties are updated
        const updatedUserData = await db.doc(getUserPath(organisationId, userId)).get();
        expect(updatedUserData.data()?.relatedProperties).toContain(propertyId);
    });
});
