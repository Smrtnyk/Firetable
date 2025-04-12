import type { Role, User } from "@shared-types/auth.js";
import type { EventDoc, EventFloorDoc } from "@shared-types/event.js";
import type { FloorDoc } from "@shared-types/floor.js";
import type { GuestDoc } from "@shared-types/guest.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";
import type { PropertyDoc } from "@shared-types/property.js";

import { faker } from "@faker-js/faker";
import { DEFAULT_CAPABILITIES_BY_ROLE } from "@shared-types/auth.js";
import { OrganisationStatus } from "@shared-types/organisation.js";

import { generateFirestoreId, hashPhoneNumber } from "./utils.js";

export const DataGenerator = {
    generateEvent(
        propertyId: string,
        organisationId: string,
        creator: string,
        startDate: number,
    ): Omit<EventDoc, "_doc"> {
        const eventPrefixes = ["Ultra", "Mega", "Night", "Deep", "Pure", "Epic", "Elite"];
        const eventTypes = ["Party", "Night", "Festival", "Experience", "Vibes", "Sessions"];
        const genres = ["House", "Techno", "Hip Hop", "R&B", "Dance", "EDM"];

        const name = `${faker.helpers.arrayElement(eventPrefixes)} ${faker.helpers.arrayElement(
            eventTypes,
        )} ${faker.helpers.arrayElement(genres)}`;

        return {
            creator,
            date: startDate,
            entryPrice: faker.number.int({ max: 100, min: 10 }) * 5,
            guestListLimit: faker.number.int({ max: 500, min: 50 }),
            id: generateFirestoreId(),
            img: "",
            info: faker.lorem.paragraph(3),
            name,
            organisationId,
            propertyId,
        };
    },

    generateEventFloor(baseFloor: FloorDoc, order: number): EventFloorDoc {
        return {
            ...baseFloor,
            order,
        };
    },

    generateFloor(
        id: string,
        propertyId: string,
        floorNumber: number,
    ): Pick<FloorDoc, "id" | "name" | "propertyId"> {
        const floorNames = [
            "Main Floor",
            "VIP Level",
            "Rooftop Lounge",
            "Mezzanine",
            "Garden Terrace",
            "Underground",
        ];

        return {
            id,
            name: floorNames[floorNumber - 1] ?? `Floor ${floorNumber}`,
            propertyId,
        };
    },

    generateGuest(): GuestDoc {
        const contact = DataGenerator.generatePhoneNumber();
        const hashedContact = hashPhoneNumber(contact);
        const maskedContact = contact.replaceAll(/\d(?=\d{4})/g, "*");

        return {
            contact,
            hashedContact,
            id: generateFirestoreId(),
            lastModified: Date.now(),
            maskedContact,
            name: faker.person.fullName(),
            tags: faker.helpers.arrayElements(
                ["VIP", "Regular", "New", "Birthday", "Special Guest", "High Spender"],
                { max: 2, min: 0 },
            ),
            visitedProperties: {},
        };
    },

    generateOrganisation(id: string): OrganisationDoc {
        return {
            id,
            maxAllowedProperties: faker.number.int({ max: 20, min: 5 }),
            name: faker.company.name(),
            status: OrganisationStatus.ACTIVE,
        };
    },

    generatePhoneNumber(): string {
        return faker.phone.number({
            style: "international",
        });
    },

    generateProperty(id: string, organisationId: string): PropertyDoc {
        const nightclubPrefixes = ["Club", "Lounge", "Bar", "Sky", "VIP", "Ultra", "Elite"];
        const nightclubSuffixes = ["Night", "Vibe", "Zone", "Estate", "District", "Society"];

        const name = `${faker.helpers.arrayElement(nightclubPrefixes)} ${faker.helpers.arrayElement(
            nightclubSuffixes,
        )} ${faker.location.city()}`;

        return {
            id,
            name,
            organisationId,
        };
    },

    generateUser(organisationId: string, role: Role, properties: string[], orgName: string): User {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();

        const cleanOrgName = orgName
            .toLowerCase()
            .replaceAll(/[^\da-z]/g, "")
            .replaceAll(/\s+/g, "");

        // Generate unique counter for this role+org combination
        const roleOrgKey = `${role}-${cleanOrgName}`;
        this.userCounters[roleOrgKey] ??= 0;
        this.userCounters[roleOrgKey]++;

        const emailPrefix = role.toLowerCase().replaceAll(/\s+/g, "");
        const uniqueId = this.userCounters[roleOrgKey].toString().padStart(3, "0");
        const email = `${emailPrefix}${uniqueId}@${cleanOrgName}.org`;

        const username = `${emailPrefix}${uniqueId}`;

        return {
            capabilities: DEFAULT_CAPABILITIES_BY_ROLE[role],
            email,
            id: generateFirestoreId(),
            name: `${firstName} ${lastName}`,
            organisationId,
            relatedProperties: properties,
            role,
            username,
        };
    },

    userCounters: {} as Record<string, number>,
};
