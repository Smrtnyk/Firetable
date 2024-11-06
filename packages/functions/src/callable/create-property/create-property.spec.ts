import type { CallableRequest } from "firebase-functions/v2/https";
import { createPropertyFn } from "./create-property.js";
import { MockFieldValue, MockFirestore } from "../../../test-helpers/MockFirestore.js";
import * as Init from "../../init.js";
import { getPropertyPath, getUserPath, getUsersPath } from "../../paths.js";
import * as Firestore from "firebase-admin/firestore";
import { beforeEach, vi, describe, expect, it } from "vitest";

vi.mock("firebase-admin/firestore");

describe("createPropertyFn", () => {
    let mockFirestore: MockFirestore;

    function mockRequest<T>(data: T, auth: any): CallableRequest<T> {
        return {
            data,
            auth,
            rawRequest: {} as any,
        };
    }

    beforeEach(() => {
        mockFirestore = new MockFirestore();

        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
        vi.spyOn(Firestore, "FieldValue", "get").mockReturnValue(MockFieldValue as any);
    });

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
        await mockFirestore.collection(getUsersPath(organisationId)).doc(userId).set(userData);

        const request = mockRequest(
            { name: propertyName, organisationId },
            { uid: userId, token: { role: roleName } },
        );
        const propertyId = await createPropertyFn(request);

        expect(propertyId).toBeDefined();

        // Check if the property data is correctly stored
        const propertyData = mockFirestore.getDataAtPath(
            getPropertyPath(organisationId, propertyId),
        );
        expect(propertyData!.data).toStrictEqual({
            name: propertyName,
            organisationId,
            creatorId: userId,
        });

        // Check if the user's related properties are updated
        const updatedUserData = mockFirestore.getDataAtPath(getUserPath(organisationId, userId));
        expect(updatedUserData!.data.relatedProperties).toContain(propertyId);
    });
});
