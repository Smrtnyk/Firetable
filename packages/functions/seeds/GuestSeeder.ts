import type { EventDoc } from "@shared-types/event.js";
import type { GuestDoc } from "@shared-types/guest.js";
import type { OrganisationDoc } from "@shared-types/organisation.js";
import type { PropertyDoc } from "@shared-types/index.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { DataGenerator } from "./DataGenerator.js";
import { logger } from "./logger.js";
import { getGuestsPath } from "../src/paths.js";
import { faker } from "@faker-js/faker";

export class GuestSeeder extends BaseSeeder {
    async seedForOrganisation(
        organisation: OrganisationDoc,
        properties: PropertyDoc[],
        events: Omit<EventDoc, "_doc">[],
    ): Promise<void> {
        const startTime = Date.now();
        logger.info(`Creating guests for organisation "${organisation.name}"`);

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

        const stats = {
            totalGuests: 0,
            totalVisits: 0,
            guestsWithContact: 0,
            guestsWithMultipleVisits: 0,
            vipGuests: 0,
            propertiesWithGuests: 0,
        };

        for (const property of orgProperties) {
            const propertyEvents = eventsByProperty[property.id] ?? [];
            if (propertyEvents.length === 0) {
                logger.warn(`No events found for property "${property.name}", skipping...`);
                continue;
            }

            const numGuests = faker.number.int({ min: 100, max: 1000 });
            logger.info(`Creating ${numGuests} guests for property "${property.name}"`);

            const propertyStart = Date.now();
            const guests: GuestDoc[] = [];
            let propertyVisits = 0;

            for (let i = 0; i < numGuests; i++) {
                const guestEvents = faker.helpers.arrayElements(
                    propertyEvents,
                    faker.number.int({ min: 1, max: 5 }),
                );

                const guest = DataGenerator.generateGuest();

                // Track guest with contact info
                if (guest.contact) {
                    stats.guestsWithContact++;
                }

                // Track VIP guests
                if (guest.tags?.includes("VIP")) {
                    stats.vipGuests++;
                }

                if (guestEvents.length > 1) {
                    stats.guestsWithMultipleVisits++;
                    propertyVisits += guestEvents.length;

                    guestEvents.forEach((event) => {
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
                stats.propertiesWithGuests++;
                stats.totalGuests += guests.length;
                stats.totalVisits += propertyVisits;

                const propertyDuration = ((Date.now() - propertyStart) / 1000).toFixed(2);
                logger.stats(
                    {
                        "Guests Created": guests.length,
                        "Total Visits": propertyVisits,
                        Time: `${propertyDuration}s`,
                    },
                    2,
                );
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info("Guest seeding statistics:");
        logger.stats({
            "Total Guests": stats.totalGuests,
            "Total Visits": stats.totalVisits,
            "Guests with Contact": stats.guestsWithContact,
            "Multiple Visit Guests": stats.guestsWithMultipleVisits,
            "VIP Guests": stats.vipGuests,
            "Properties with Guests": stats.propertiesWithGuests,
            "Total Time": `${duration}s`,
        });
    }
}
