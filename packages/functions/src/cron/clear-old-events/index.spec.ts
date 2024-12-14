import { getEventPath } from "../../paths.js";
import { db } from "../../init.js";
import { clearOldEvents } from "./index.js";
import { CollectionReference } from "firebase-admin/firestore";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { Collection } from "@shared-types";

describe("clearOldEvents Function", () => {
    beforeEach(async () => {
        vi.restoreAllMocks();

        // Create Mock Organisations
        const orgsRef = db.collection(Collection.ORGANISATIONS);
        const org1Ref = orgsRef.doc("org1");
        await org1Ref.set({ name: "Organisation 1" });

        // Create Mock Properties for Organisation
        const propertiesCollectionRef = org1Ref.collection(Collection.PROPERTIES);
        const property1Ref = propertiesCollectionRef.doc("property1");
        await property1Ref.set({ name: "Property 1" });

        // Create Mock Events for Property
        const eventsCollectionRef = property1Ref.collection(Collection.EVENTS);
        await eventsCollectionRef
            .doc("oldEvent")
            .set(createEventMock(getDateOneYearAgo(), "org1", "property1"));
        await eventsCollectionRef
            .doc("recentEvent")
            .set(createEventMock(new Date(), "org1", "property1"));
    });

    it("should successfully delete old events", async () => {
        await clearOldEvents();

        // Assertions
        const oldEventSnapshot = await db.doc(getEventPath("org1", "property1", "oldEvent")).get();
        expect(oldEventSnapshot.exists).toBe(false);

        const recentEventSnapshot = await db
            .doc(getEventPath("org1", "property1", "recentEvent"))
            .get();
        expect(recentEventSnapshot.exists).toBe(true);
    });

    it("should not delete recent events", async () => {
        await clearOldEvents();

        // Assertions
        const recentEventSnapshot = await db
            .doc(getEventPath("org1", "property1", "recentEvent"))
            .get();
        expect(recentEventSnapshot.exists).toBe(true);
    });

    it("should handle errors during data fetching and deletion", async () => {
        // Simulate an error
        vi.spyOn(CollectionReference.prototype, "get").mockRejectedValue(
            new Error("Database fetch error"),
        );

        await expect(clearOldEvents()).rejects.toThrow("Failed to clear old events");
    });
});

function getDateOneYearAgo(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date;
}

function createEventMock(
    date: Date,
    organisationId: string,
    propertyId: string,
): Record<string, any> {
    return {
        name: "Event Name",
        date: date.getTime(),
        guestListLimit: 100,
        img: "image_url",
        propertyId,
        organisationId,
    };
}
