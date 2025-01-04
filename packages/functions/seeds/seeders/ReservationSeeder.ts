import type { EventDoc } from "@shared-types/event.js";
import type {
    PlannedReservation,
    PlannedReservationDoc,
    User,
    WalkInReservation,
    WalkInReservationDoc,
} from "@shared-types/index.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { db } from "../init.js";
import { decompressJson, extractTableLabels, generateFirestoreId } from "../utils.js";
import { DataGenerator } from "../DataGenerator.js";
import { logger } from "../logger.js";
import { getEventPath, getReservationsPath } from "../../src/paths.js";
import {
    ReservationState,
    ReservationStatus,
    ReservationType,
    Collection,
} from "@shared-types/index.js";
import { faker } from "@faker-js/faker";

export class ReservationSeeder extends BaseSeeder {
    async seedForEvents(events: Omit<EventDoc, "_doc">[], users: User[]): Promise<void> {
        let totalReservations = 0;
        let currentReservation = 0;
        let totalPlanned = 0;
        let totalWalkIn = 0;
        let totalTablesUsed = 0;
        let totalFloorsWithReservations = 0;

        // First pass: estimate how many total reservations we'll generate
        for (const event of events) {
            const floorsSnapshot = await db
                .collection(
                    `${getEventPath(event.organisationId, event.propertyId, event.id)}/${Collection.FLOORS}`,
                )
                .get();

            for (const floorDoc of floorsSnapshot.docs) {
                const decompressedJson = await decompressJson(floorDoc.data().json);
                const floorTableLabels = extractTableLabels(decompressedJson);
                if (floorTableLabels.length === 0) continue;

                // We'll pick random # of reservations for each floor
                const minReservations = Math.ceil(floorTableLabels.length * 0.3);
                const maxReservations = floorTableLabels.length;

                totalReservations += faker.number.int({
                    min: minReservations,
                    max: maxReservations,
                });
            }
        }

        // Second pass: actually create reservations
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

                // Shuffle table labels so we don’t reuse the same ones multiple times
                const shuffledLabels = faker.helpers.shuffle(floorTableLabels);
                // Decide how many tables will get reservations in this floor
                const minReservations = Math.ceil(shuffledLabels.length * 0.3);
                const maxReservations = shuffledLabels.length;
                const reservationCount = faker.number.int({
                    min: minReservations,
                    max: maxReservations,
                });

                const usedTableLabels = shuffledLabels.slice(0, reservationCount);

                for (const tableLabel of usedTableLabels) {
                    const randomCreator = faker.helpers.arrayElement(users);
                    const randomReservedBy = faker.helpers.arrayElement(users);

                    if (faker.number.int({ min: 1, max: 100 }) <= 70) {
                        // 70% chance of planned
                        allReservations.push(
                            this.generatePlannedReservation(
                                tableLabel,
                                floorDoc.id,
                                randomCreator,
                                randomReservedBy,
                            ),
                        );
                        totalPlanned++;
                    } else {
                        // 30% chance of walk-in
                        allReservations.push(
                            this.generateWalkInReservation(tableLabel, floorDoc.id, randomCreator),
                        );
                        totalWalkIn++;
                    }

                    currentReservation++;
                    logger.progress(currentReservation, totalReservations, "Creating reservations");
                }

                totalTablesUsed += floorTableLabels.length;
                totalFloorsWithReservations++;
            }

            if (allReservations.length > 0) {
                await this.batchWrite(allReservations, reservationsPath);
            }
        }

        logger.stats({
            "Total Reservations": totalReservations,
            "Planned Reservations": totalPlanned,
            "Walk-in Reservations": totalWalkIn,
            "Tables Used": totalTablesUsed,
            "Floors With Reservations": totalFloorsWithReservations,
        });
    }

    private generatePlannedReservation(
        tableLabel: string,
        floorId: string,
        creatorUser: User,
        reservedByUser: User,
    ): PlannedReservationDoc {
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ min: 1, max: 100 }) <= 20;
        const randomState = faker.helpers.arrayElement([
            ReservationState.PENDING,
            ReservationState.CONFIRMED,
            ReservationState.ARRIVED,
        ]);
        const flags = this.getReservationFlags(randomState);

        return {
            id: generateFirestoreId(),
            floorId,
            tableLabel,
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
            state: randomState,
            ...flags,
            type: ReservationType.PLANNED,
            cancelled: false,
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
        tableLabel: string,
        floorId: string,
        creatorUser: User,
    ): WalkInReservationDoc {
        const isVIP = faker.datatype.boolean();
        const hasContact = faker.number.int({ min: 1, max: 100 }) <= 20;

        return {
            id: generateFirestoreId(),
            floorId,
            tableLabel,
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

    private getReservationFlags(state: ReservationState): {
        reservationConfirmed: boolean;
        arrived: boolean;
        waitingForResponse: boolean;
    } {
        switch (state) {
            case ReservationState.PENDING:
                return {
                    reservationConfirmed: false,
                    arrived: false,
                    waitingForResponse: true,
                };
            case ReservationState.CONFIRMED:
                return {
                    reservationConfirmed: true,
                    arrived: false,
                    waitingForResponse: false,
                };
            case ReservationState.ARRIVED:
                return {
                    reservationConfirmed: false,
                    arrived: true,
                    waitingForResponse: false,
                };
        }
        throw new Error("Invalid reservation state");
    }
}
