import type { CreateEventPayload } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { getEventPath } from "../../paths.js";
import { db } from "../../init.js";
import { createEvent } from "./index.js";
import { describe, it, expect } from "vitest";

const AUTH_USER_EMAIL = "test@example.com";
const ORGANISATION_ID = "org456";
const PROPERTY_ID = "property123";

describe("create-event", () => {
    it("should create an event", async () => {
        // Prepare test data
        const entryPrice = 10;
        const mockRequest = {
            auth: { token: { email: AUTH_USER_EMAIL } },
            data: {
                date: Date.now(),
                floors: [
                    { id: "floor1", json: "some json" },
                    { id: "floor2", json: "some json" },
                ],
                entryPrice,
                guestListLimit: 100,
                name: "Test Event",
                propertyId: PROPERTY_ID,
                organisationId: ORGANISATION_ID,
                img: "image_url",
            },
            rawRequest: {} as any,
        } as CallableRequest<CreateEventPayload>;

        // Call the function
        const result = await createEvent(mockRequest);

        // Assert the results
        expect(result).toEqual({
            id: expect.any(String),
            propertyId: "property123",
            organisationId: "org456",
        });

        const pathToEvent = getEventPath(ORGANISATION_ID, PROPERTY_ID, result.id);

        // Check if the data is correctly stored in the mock Firestore
        const eventData = await db.doc(pathToEvent).get();

        expect(eventData.data()).toStrictEqual({
            creator: AUTH_USER_EMAIL,
            date: expect.any(Number),
            entryPrice,
            guestListLimit: 100,
            img: "image_url",
            name: "Test Event",
            organisationId: ORGANISATION_ID,
            propertyId: PROPERTY_ID,
        });
    });

    it("should create an event with multiple floors", async () => {
        const entryPrice = 10;
        const mockFloor = {
            id: "floor1",
            name: "Test Floor",
            json: "some compressed json",
        };

        const mockRequest = {
            auth: { token: { email: AUTH_USER_EMAIL } },
            data: {
                date: Date.now(),
                // Same floor added twice
                floors: [mockFloor, mockFloor],
                entryPrice,
                guestListLimit: 100,
                name: "Test Event",
                propertyId: PROPERTY_ID,
                organisationId: ORGANISATION_ID,
                img: "image_url",
            },
            rawRequest: {} as any,
        } as CallableRequest<CreateEventPayload>;

        const result = await createEvent(mockRequest);

        // Check event data
        const pathToEvent = getEventPath(ORGANISATION_ID, PROPERTY_ID, result.id);
        const eventData = await db.doc(pathToEvent).get();

        expect(eventData.data()).toStrictEqual({
            creator: AUTH_USER_EMAIL,
            date: expect.any(Number),
            entryPrice,
            guestListLimit: 100,
            img: "image_url",
            name: "Test Event",
            organisationId: ORGANISATION_ID,
            propertyId: PROPERTY_ID,
        });

        // Check that two floor documents were created
        const floorsCollection = await db.collection(`${pathToEvent}/floors`).get();
        const floorDocs = floorsCollection.docs;
        expect(floorDocs.length).toBe(2);

        // Verify each floor document has the correct data
        floorDocs.forEach((doc) => {
            expect(doc.data()).toEqual(mockFloor);
        });
    });

    it("should throw error if floor data is invalid", () => {
        const mockRequest = {
            auth: { token: { email: AUTH_USER_EMAIL } },
            data: {
                date: Date.now(),
                floors: [{ id: "floor1", name: "Invalid Floor" }],
                entryPrice: 10,
                guestListLimit: 100,
                name: "Test Event",
                propertyId: PROPERTY_ID,
                organisationId: ORGANISATION_ID,
            },
            rawRequest: {} as any,
        } as CallableRequest<CreateEventPayload>;

        expect(() => createEvent(mockRequest)).toThrow("Invalid floor data provided");
    });
});
