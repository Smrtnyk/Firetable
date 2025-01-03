import type { OrganisationDoc } from "@shared-types/organisation.js";
import type { Role, User } from "@shared-types/auth.js";
import type { PropertyDoc } from "@shared-types/property.js";
import type { FloorDoc } from "@shared-types/floor.js";
import type { EventDoc, EventFloorDoc } from "@shared-types/event.js";
import type { GuestDoc } from "@shared-types/guest.js";
import { generateFirestoreId, hashPhoneNumber } from "./utils.js";
import { DEFAULT_CAPABILITIES_BY_ROLE } from "@shared-types/auth.js";
import { OrganisationStatus } from "@shared-types/organisation.js";
import { faker } from "@faker-js/faker";

export const DataGenerator = {
    userCounters: {} as Record<string, number>,

    generateOrganisation(id: string): OrganisationDoc {
        return {
            id,
            name: faker.company.name(),
            maxAllowedProperties: faker.number.int({ min: 5, max: 20 }),
            status: OrganisationStatus.ACTIVE,
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
        if (!this.userCounters[roleOrgKey]) {
            this.userCounters[roleOrgKey] = 0;
        }
        this.userCounters[roleOrgKey]++;

        const emailPrefix = role.toLowerCase().replaceAll(/\s+/g, "");
        const uniqueId = this.userCounters[roleOrgKey].toString().padStart(3, "0");
        const email = `${emailPrefix}${uniqueId}@${cleanOrgName}.org`;

        const username = `${emailPrefix}${uniqueId}`;

        return {
            id: generateFirestoreId(),
            name: `${firstName} ${lastName}`,
            email,
            username,
            role,
            relatedProperties: properties,
            organisationId,
            capabilities: DEFAULT_CAPABILITIES_BY_ROLE[role],
        };
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
            id: generateFirestoreId(),
            creator,
            date: startDate,
            entryPrice: faker.number.int({ min: 10, max: 100 }) * 5,
            name,
            guestListLimit: faker.number.int({ min: 50, max: 500 }),
            propertyId,
            organisationId,
            info: faker.lorem.paragraph(3),
            img: "",
        };
    },

    generateEventFloor(baseFloor: FloorDoc, order: number): EventFloorDoc {
        return {
            ...baseFloor,
            order,
        };
    },

    generatePhoneNumber(): string {
        return faker.phone.number({
            style: "international",
        });
    },

    generateGuest(): GuestDoc {
        const contact = DataGenerator.generatePhoneNumber();
        const hashedContact = hashPhoneNumber(contact);
        const maskedContact = contact.replaceAll(/\d(?=\d{4})/g, "*");

        return {
            id: generateFirestoreId(),
            name: faker.person.fullName(),
            contact,
            hashedContact,
            maskedContact,
            lastModified: Date.now(),
            tags: faker.helpers.arrayElements(
                ["VIP", "Regular", "New", "Birthday", "Special Guest", "High Spender"],
                { min: 0, max: 2 },
            ),
            visitedProperties: {},
        };
    },
};
