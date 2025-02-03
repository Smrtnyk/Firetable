import type { GuestDoc } from "@shared-types";
import type { CallableRequest } from "firebase-functions/v2/https";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GuestData, PreparedGuestData } from "./set-guest-data.js";

import { db } from "../../init.js";
import { getGuestsPath } from "../../paths.js";
import { setGuestDataFn } from "./set-guest-data.js";

const organisationId = "orgId";
const contact = "guestContact";
const maskedContact = "maskedContact";
const hashedContact = "hashedContact";

const preparedGuestData: PreparedGuestData = {
    arrived: false,
    cancelled: false,
    contact,
    guestName: "guestName",
    hashedContact,
    isVIP: true,
    maskedContact,
};

const mockTimestamp = 1_699_999_999_999;

const date = Date.now();

const testRequestData = {
    eventDate: date,
    eventId: "eventId",
    eventName: "eventName",
    organisationId,
    preparedGuestData,
    propertyId: "propertyId",
};

describe("setGuestDataFn", () => {
    beforeEach(() => {
        vi.setSystemTime(mockTimestamp);
    });

    it("should create a new guest if they do not exist", async () => {
        await setGuestDataFn({ data: testRequestData } as CallableRequest<GuestData>);

        // Query the guests collection for the guest with contact == guestContact
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
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
            contact,
            hashedContact,
            lastModified: 1,
            maskedContact,
            name: "guestName",
            visitedProperties: {},
        };

        // Add a guest document to the guests collection
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
        await guestsCollectionRef.add(initialGuestData);

        const requestData = {
            eventDate: date,
            eventId: "eventId",
            eventName: "eventName",
            organisationId,
            preparedGuestData: { ...preparedGuestData, arrived: true },
            propertyId: "propertyId",
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
            contact,
            hashedContact,
            lastModified: 1,
            maskedContact,
            name: "guestName",
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
        };

        // Add a guest document to the guests collection
        const guestsCollectionRef = db.collection(getGuestsPath(organisationId));
        await guestsCollectionRef.add(initialGuestData);

        const requestData = {
            eventDate: date,
            eventId: "newEventId",
            eventName: "newEventName",
            organisationId,
            preparedGuestData: { ...preparedGuestData, arrived: true },
            propertyId: "propertyId",
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
            eventDate: date,
            eventId: "eventId",
            eventName: "eventName",
            organisationId: "orgId",
            preparedGuestData: {
                // Invalid reservation data
            },
            propertyId: "propertyId",
        };

        // Expect the function to throw an error due to invalid data
        await expect(
            setGuestDataFn({ data: requestData } as CallableRequest<GuestData>),
        ).rejects.toThrow();
    });
});
