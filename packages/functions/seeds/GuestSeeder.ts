import type { EventDoc } from "@shared-types/event.js";
import type { GuestDoc } from "@shared-types/guest.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";
import type { PropertyDoc } from "@shared-types/index.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { getGuestsPath } from "../src/paths.js";
import { faker } from "@faker-js/faker";

export class GuestSeeder extends BaseSeeder {
    async seedForOrganisation(
        organisation: OrganisationDoc,
        properties: PropertyDoc[],
        events: Omit<EventDoc, "_doc">[],
    ): Promise<void> {
        const eventsByProperty = events.reduce<Record<string, Omit<EventDoc, "_doc">[]>>(
            (acc, event) => {
                if (!acc[event.propertyId]) {
                    acc[event.propertyId] = [];
                }
                acc[event.propertyId]?.push(event);
                return acc;
            },
            {},
        );

        const orgProperties = properties.filter(
            (property) => property.organisationId === organisation.id,
        );
        const guests: GuestDoc[] = [];

        for (const property of orgProperties) {
            const propertyEvents = eventsByProperty[property.id] ?? [];
            if (propertyEvents.length === 0) continue;

            const numGuests = faker.number.int({ min: 100, max: 1000 });

            for (let i = 0; i < numGuests; i++) {
                const guestEvents = faker.helpers.arrayElements(
                    propertyEvents,
                    faker.number.int({ min: 1, max: 5 }),
                );

                const guest = DataGenerator.generateGuest();

                if (guestEvents.length > 1) {
                    guestEvents.slice(1).forEach((event) => {
                        if (!guest.visitedProperties[property.id]) {
                            guest.visitedProperties[property.id] = {};
                        }
                        guest.visitedProperties[property.id]![event.id] = {
                            date: event.date,
                            eventName: event.name,
                            arrived: faker.datatype.boolean(),
                            cancelled: faker.datatype.boolean(),
                            isVIPVisit: guest.tags?.includes("VIP") || false,
                        };
                    });
                }

                guests.push(guest);
            }

            if (guests.length > 0) {
                await this.batchWrite(guests, getGuestsPath(organisation.id));
            }
        }
    }
}
