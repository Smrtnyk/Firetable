import type { CreateEventPayload } from "../../../types/types.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { db } from "../../init.js";
import { getEventPath } from "../../paths.js";
import { createEvent } from "./index.js";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../init", () => ({
    db: new MockFirestore(),
    auth: vi.fn(),
}));

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
                floors: [{ id: "floor1" }, { id: "floor2" }],
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
        const eventData = db.getDataAtPath(pathToEvent);

        expect(eventData).toStrictEqual({
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
});
