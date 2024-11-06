import type { CreateEventPayload } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import * as Init from "../../init.js";
import { getEventPath } from "../../paths.js";
import { createEvent } from "./index.js";
import { beforeEach, describe, vi, it, expect } from "vitest";

const AUTH_USER_EMAIL = "test@example.com";
const ORGANISATION_ID = "org456";
const PROPERTY_ID = "property123";

describe("create-event", () => {
    let db: MockFirestore;

    beforeEach(() => {
        db = new MockFirestore();
        vi.spyOn(Init, "db", "get").mockReturnValue(db as any);
    });

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
        const eventData = db.getDataAtPath(pathToEvent)!.data;

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
