import type { GuestData } from "./set-guest-data.js";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { GuestDoc } from "../../../types/types.js";
import { setGuestDataFn } from "./set-guest-data.js";
import * as Init from "../../init.js";
import { getGuestPath, getGuestsPath } from "../../paths.js";
import { MockFirestore } from "../../../test-helpers/MockFirestore.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

const organisationId = "orgId";
const guestContact = "guestContact";

const testSimpleReservation = {
    guestContact,
    guestName: "guestName",
    arrived: false,
};

const date = Date.now();

const testRequestData = {
    reservation: testSimpleReservation,
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
    });

    it("should create a new guest if they do not exist", async () => {
        await setGuestDataFn({ data: testRequestData } as CallableRequest<GuestData>);

        const guestDoc = mockFirestore.getDataAtPath(getGuestPath(organisationId, guestContact));
        expect(guestDoc).toBeDefined();
        const guestVisits =
            guestDoc.visitedProperties[testRequestData.propertyId][testRequestData.eventId];
        expect(guestVisits).toStrictEqual({
            arrived: false,
            cancelled: false,
            date,
            eventName: "eventName",
        });
    });

    it("should update an existing guest with new visit information", async () => {
        const initialGuestData: GuestDoc = {
            name: "guestName",
            contact: guestContact,
            visitedProperties: {},
        };
        await mockFirestore
            .collection(getGuestsPath(organisationId))
            .doc(guestContact)
            .set(initialGuestData);

        const requestData = {
            reservation: { ...testSimpleReservation, arrived: true },
            propertyId: "propertyId",
            organisationId,
            eventId: "eventId",
            eventName: "eventName",
            eventDate: date,
        };

        await setGuestDataFn({ data: requestData } as CallableRequest<GuestData>);

        const guestDoc = mockFirestore.getDataAtPath(getGuestPath(organisationId, guestContact));

        const guestVisits = guestDoc.visitedProperties[requestData.propertyId];
        expect(guestVisits).toStrictEqual({
            eventId: {
                arrived: true,
                cancelled: false,
                date,
                eventName: "eventName",
            },
        });
    });

    it("should handle errors gracefully", async () => {
        const requestData = {
            reservation: {
                /* ... invalid or incomplete reservation data ... */
            },
            propertyId: "propertyId",
            organisationId: "orgId",
            eventId: "eventId",
        };

        // Expect the function to throw an error due to invalid data
        await expect(
            setGuestDataFn({ data: requestData } as CallableRequest<GuestData>),
        ).rejects.toThrow();
    });
});
