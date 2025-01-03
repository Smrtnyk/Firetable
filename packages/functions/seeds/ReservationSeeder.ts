import type { EventDoc } from "@shared-types/event.js";
import type {
    PlannedReservation,
    PlannedReservationDoc,
    User,
    WalkInReservation,
    WalkInReservationDoc,
} from "@shared-types/index.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { db } from "./init.js";
import { decompressJson, extractTableLabels, generateFirestoreId } from "./utils.js";
import { DataGenerator } from "./DataGenerator.js";
import { getEventPath, getReservationsPath } from "../src/paths.js";
import {
    ReservationState,
    ReservationStatus,
    ReservationType,
    Collection,
} from "@shared-types/index.js";
import { faker } from "@faker-js/faker";

export class ReservationSeeder extends BaseSeeder {
    async seedForEvents(events: Omit<EventDoc, "_doc">[], users: User[]): Promise<void> {
        for (const event of events) {
            const floorsSnapshot = await db
                .collection(
                    `${getEventPath(event.organisationId, event.propertyId, event.id)}/${Collection.FLOORS}`,
                )
                .get();

            const reservationsPath = getReservationsPath(
                event.organisationId,
                event.propertyId,
                event.id,
            );
            const allReservations: (PlannedReservation | WalkInReservation)[] = [];

            for (const floorDoc of floorsSnapshot.docs) {
                const decompressedJson = await decompressJson(floorDoc.data().json);
                const floorTableLabels = extractTableLabels(decompressedJson);
                if (floorTableLabels.length === 0) continue;

                // Calculate reservations for this floor (30-100% of tables)
                const minReservations = Math.ceil(floorTableLabels.length * 0.3);
                const maxReservations = floorTableLabels.length;
                const reservationCount = faker.number.int({
                    min: minReservations,
                    max: maxReservations,
                });

                // Generate reservations for this floor
                for (let i = 0; i < reservationCount; i++) {
                    // Pick random users for creator / reservedBy
                    const randomCreator = faker.helpers.arrayElement(users);
                    const randomReservedBy = faker.helpers.arrayElement(users);

                    if (faker.number.int({ min: 1, max: 100 }) <= 70) {
                        allReservations.push(
                            this.generatePlannedReservation(
                                floorTableLabels,
                                floorDoc.id,
                                randomCreator,
                                randomReservedBy,
                            ),
                        );
                    } else {
                        allReservations.push(
                            this.generateWalkInReservation(
                                floorTableLabels,
                                floorDoc.id,
                                randomCreator,
                            ),
                        );
                    }
                }
            }

            if (allReservations.length > 0) {
                await this.batchWrite(allReservations, reservationsPath);
            }
        }
        console.log("✓ Seeded reservations");
    }

    private generatePlannedReservation(
        tableLabels: string[],
        floorId: string,
        creatorUser: User,
        reservedByUser: User,
    ): PlannedReservationDoc {
        const table = faker.helpers.arrayElement(tableLabels);
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ min: 1, max: 100 }) <= 20;

        return {
            id: generateFirestoreId(),
            floorId,
            tableLabel: table,
            guestContact: hasContact ? DataGenerator.generatePhoneNumber() : "",
            numberOfGuests: faker.number.int({ min: 1, max: 10 }),
            reservationNote:
                faker.helpers.maybe(() => faker.lorem.sentence(), {
                    probability: 0.3,
                }) ?? "",
            time: faker.helpers.arrayElement(["20:00", "21:00", "22:00", "23:00"]),
            creator: {
                id: creatorUser.id,
                name: creatorUser.name,
                email: creatorUser.email,
                createdAt: faker.date.recent().getTime(),
            },
            status: ReservationStatus.ACTIVE,
            state: faker.helpers.arrayElement([
                ReservationState.PENDING,
                ReservationState.CONFIRMED,
                ReservationState.ARRIVED,
            ]),
            type: ReservationType.PLANNED,
            reservationConfirmed: true,
            cancelled: false,
            arrived: faker.datatype.boolean(),
            waitingForResponse: false,
            consumption: isVIP
                ? faker.number.int({ min: 500, max: 2000 })
                : faker.number.int({ min: 50, max: 500 }),
            guestName: faker.person.fullName(),
            reservedBy: {
                id: reservedByUser.id,
                name: reservedByUser.name,
                email: reservedByUser.email,
            },
            isVIP,
        };
    }

    private generateWalkInReservation(
        tableLabels: string[],
        floorId: string,
        creatorUser: User,
    ): WalkInReservationDoc {
        const table = faker.helpers.arrayElement(tableLabels);
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ min: 1, max: 100 }) <= 20;

        return {
            id: generateFirestoreId(),
            floorId,
            tableLabel: table,
            guestContact: hasContact ? DataGenerator.generatePhoneNumber() : "",
            numberOfGuests: faker.number.int({ min: 1, max: 10 }),
            reservationNote:
                faker.helpers.maybe(() => faker.lorem.sentence(), {
                    probability: 0.3,
                }) ?? "",
            time: faker.helpers.arrayElement(["20:00", "21:00", "22:00", "23:00"]),
            creator: {
                id: creatorUser.id,
                name: creatorUser.name,
                email: creatorUser.email,
                createdAt: faker.date.recent().getTime(),
            },
            status: ReservationStatus.ACTIVE,
            state: ReservationState.ARRIVED,
            type: ReservationType.WALK_IN,
            guestName: faker.person.fullName(),
            consumption: isVIP
                ? faker.number.int({ min: 500, max: 2000 })
                : faker.number.int({ min: 50, max: 500 }),
            arrived: true,
            isVIP,
        };
    }
}
