import type { CreatePropertyPayload } from "@shared-types/property.js";
import type { CallableRequest } from "firebase-functions/v2/https";

import { describe, expect, it } from "vitest";

import { db } from "../../init.js";
import { getPropertyPath, getUserPath, getUsersPath } from "../../paths.js";
import { createPropertyFn } from "./create-property.js";

describe("createPropertyFn", () => {
    function mockRequest(
        data: CreatePropertyPayload,
        auth: any,
    ): CallableRequest<CreatePropertyPayload> {
        return {
            acceptsStreaming: false,
            auth,
            data,
            rawRequest: {} as any,
        };
    }

    it("should throw error if user is not authenticated", async () => {
        const request = mockRequest(
            { img: "", name: "Test Property", organisationId: "org1" },
            null,
        );

        await expect(createPropertyFn(request)).rejects.toThrow("User must be authenticated");
    });

    it("should throw error if organisationId is missing", async () => {
        const request = mockRequest(
            // @ts-expect-error -- not passing organisationId
            { img: "", name: "Test Property" },
            { token: {}, uid: "user123" },
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
            relatedProperties: [],
            role: roleName,
        };
        await db.collection(getUsersPath(organisationId)).doc(userId).set(userData);

        const request = mockRequest(
            { img: "", name: propertyName, organisationId },
            { token: { role: roleName }, uid: userId },
        );
        const propertyId = await createPropertyFn(request);

        expect(propertyId).toBeDefined();

        // Check if the property data is correctly stored
        const propertyData = await db.doc(getPropertyPath(organisationId, propertyId)).get();
        expect(propertyData.data()).toStrictEqual({
            creatorId: userId,
            img: "",
            name: propertyName,
            organisationId,
        });

        // Check if the user's related properties are updated
        const updatedUserData = await db.doc(getUserPath(organisationId, userId)).get();
        expect(updatedUserData.data()?.relatedProperties).toContain(propertyId);
    });
});
