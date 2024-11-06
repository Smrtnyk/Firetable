import type { GuestData, PreparedGuestData } from "./set-guest-data.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { GuestDoc } from "@shared-types";
import { setGuestDataFn } from "./set-guest-data.js";
import * as Init from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const organisationId = "orgId";
const contact = "guestContact";
const maskedContact = "maskedContact";
const hashedContact = "hashedContact";

const preparedGuestData: PreparedGuestData = {
    contact,
    maskedContact,
    hashedContact,
    guestName: "guestName",
    cancelled: false,
    arrived: false,
    isVIP: true,
};

const mockTimestamp = 1_699_999_999_999;

const date = Date.now();

const testRequestData = {
    preparedGuestData,
    propertyId: "propertyId",
    organisationId,
    eventId: "eventId",
    eventName: "eventName",
    eventDate: date,
};

describe("setGuestDataFn", () => {
    let mockFirestore: MockFirestore;

    beforeEach(() => {
        mockFirestore = new MockFirestore();
        vi.spyOn(Init, "db", "get").mockReturnValue(mockFirestore as any);
        vi.setSystemTime(mockTimestamp);
    });

    it("should create a new guest if they do not exist", async () => {
        await setGuestDataFn({ data: testRequestData } as CallableRequest<GuestData>);

        // Query the guests collection for the guest with contact == guestContact
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        const querySnapshot = await guestsCollectionRef.where("contact", "==", contact).get();

        expect(querySnapshot.empty).toBe(false);
        const guestDoc = querySnapshot.docs[0];
        const guestData = guestDoc!.data();

        expect(guestData).toBeDefined();
        const guestVisits =
            guestData.visitedProperties[testRequestData.propertyId][testRequestData.eventId];
        expect(guestVisits).toStrictEqual({
            arrived: false,
            cancelled: false,
            date,
            eventName: "eventName",
            isVIPVisit: true,
        });

        // Verify lastModified is set correctly
        expect(guestData.lastModified).toBe(mockTimestamp);
    });

    it("should update an existing guest with new visit information", async () => {
        const initialGuestData: Omit<GuestDoc, "id"> = {
            lastModified: 1,
            name: "guestName",
            contact,
            hashedContact,
            maskedContact,
            visitedProperties: {},
        };

        // Add a guest document to the guests collection
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        await guestsCollectionRef.add(initialGuestData);

        const requestData = {
            preparedGuestData: { ...preparedGuestData, arrived: true },
            propertyId: "propertyId",
            organisationId,
            eventId: "eventId",
            eventName: "eventName",
            eventDate: date,
        };

        await setGuestDataFn({ data: requestData } as CallableRequest<GuestData>);

        // Query the guests collection for the guest with contact == guestContact
        const querySnapshot = await guestsCollectionRef.where("contact", "==", contact).get();

        expect(querySnapshot.empty).toBe(false);
        const guestDoc = querySnapshot.docs[0];
        const guestData = guestDoc!.data();

        const guestVisits = guestData.visitedProperties[requestData.propertyId];
        expect(guestVisits).toStrictEqual({
            [requestData.eventId]: {
                arrived: true,
                cancelled: false,
                date,
                eventName: "eventName",
                isVIPVisit: true,
            },
        });

        // Verify lastModified is updated correctly
        expect(guestData.lastModified).toBe(mockTimestamp);
    });

    it("should update lastModified when adding a new visit to an existing guest", async () => {
        const initialGuestData: Omit<GuestDoc, "id"> = {
            name: "guestName",
            contact,
            hashedContact,
            maskedContact,
            visitedProperties: {
                propertyId: {
                    existingEventId: {
                        arrived: true,
                        cancelled: false,
                        date: date - 100_000,
                        eventName: "existingEvent",
                        isVIPVisit: false,
                    },
                },
            },
            lastModified: 1,
        };

        // Add a guest document to the guests collection
        const guestsCollectionRef = mockFirestore.collection(getGuestsPath(organisationId));
        await guestsCollectionRef.add(initialGuestData);

        const requestData = {
            preparedGuestData: { ...preparedGuestData, arrived: true },
            propertyId: "propertyId",
            organisationId,
            eventId: "newEventId",
            eventName: "newEventName",
            eventDate: date,
        };

        await setGuestDataFn({ data: requestData } as CallableRequest<GuestData>);

        const querySnapshot = await guestsCollectionRef.where("contact", "==", contact).get();

        expect(querySnapshot.empty).toBe(false);
        const guestDoc = querySnapshot.docs[0];
        const guestData = guestDoc!.data();

        const guestVisits = guestData.visitedProperties[requestData.propertyId];
        expect(guestVisits).toHaveProperty("existingEventId");
        expect(guestVisits).toHaveProperty("newEventId");
        expect(guestVisits.newEventId).toStrictEqual({
            arrived: true,
            cancelled: false,
            date,
            eventName: "newEventName",
            isVIPVisit: true,
        });

        // Verify lastModified is updated correctly
        expect(guestData.lastModified).toBe(mockTimestamp);
    });

    it("should handle errors gracefully", async () => {
        const requestData = {
            preparedGuestData: {
                // Invalid reservation data
            },
            propertyId: "propertyId",
            organisationId: "orgId",
            eventId: "eventId",
            eventName: "eventName",
            eventDate: date,
        };

        // Expect the function to throw an error due to invalid data
        await expect(
            setGuestDataFn({ data: requestData } as CallableRequest<GuestData>),
        ).rejects.toThrow();
    });
});
