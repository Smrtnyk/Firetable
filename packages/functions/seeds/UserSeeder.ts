import type { OrganisationDoc, PropertyDoc, User } from "@shared-types/index.js";
import { DataGenerator } from "./DataGenerator.js";
import { BaseSeeder } from "./BaseSeeder.js";
import { auth } from "./init.js";
import { generateFirestoreId } from "./utils.js";
import { getUsersPath } from "../src/paths.js";
import { AdminRole, Role } from "@shared-types/index.js";
import { faker } from "@faker-js/faker";

export class UserSeeder extends BaseSeeder {
    async seed(
        organisations: OrganisationDoc[],
        propertiesByOrg: Record<string, PropertyDoc[]>,
    ): Promise<void> {
        const usersByOrg: Record<string, User[]> = {};

        for (const org of organisations) {
            const users: User[] = [];
            const orgProperties = propertiesByOrg[org.id] ?? [];

            const roleCounts = {
                [Role.PROPERTY_OWNER]: faker.number.int({ min: 1, max: 3 }),
                [Role.MANAGER]: faker.number.int({ min: 2, max: 5 }),
                [Role.HOSTESS]: faker.number.int({ min: 5, max: 15 }),
                [Role.STAFF]: faker.number.int({ min: 10, max: 30 }),
            };

            Object.entries(roleCounts).forEach(([role, count]) => {
                for (let i = 0; i < count; i++) {
                    let assignedProperties: string[];

                    switch (role as Role) {
                        case Role.PROPERTY_OWNER:
                            // Property owners sees all properties anyway
                            assignedProperties = [];
                            break;
                        case Role.MANAGER:
                            // Managers get 50-100% of properties
                            assignedProperties = faker.helpers.arrayElements(
                                orgProperties.map(({ id }) => id),
                                {
                                    min: Math.ceil(orgProperties.length * 0.5),
                                    max: orgProperties.length,
                                },
                            );
                            break;
                        case Role.HOSTESS:
                        case Role.STAFF:
                            // Hostess and Staff get 1-3 properties
                            assignedProperties = faker.helpers.arrayElements(
                                orgProperties.map(({ id }) => id),
                                { min: 1, max: Math.min(3, orgProperties.length) },
                            );
                            break;
                    }

                    const user = DataGenerator.generateUser(
                        org.id,
                        role as Role,
                        assignedProperties,
                        org.name,
                    );
                    users.push(user);
                }
            });

            usersByOrg[org.id] = users;
            await this.batchWrite(users, getUsersPath(org.id));
        }

        const allUsers = Object.values(usersByOrg).flat();
        const authOperations = allUsers.map((user) =>
            auth
                .createUser({
                    uid: user.id,
                    email: user.email,
                    password: "USER123",
                    displayName: user.name,
                })
                .then((userRecord) =>
                    auth.setCustomUserClaims(userRecord.uid, {
                        role: user.role,
                        organisationId: user.organisationId,
                    }),
                ),
        );

        // Generate admin user
        authOperations.push(
            auth
                .createUser({
                    uid: generateFirestoreId(),
                    email: "admin@firetable.at",
                    password: "ADMIN123",
                })
                .then(function (userRecord) {
                    return auth.setCustomUserClaims(userRecord.uid, {
                        role: AdminRole.ADMIN,
                    });
                }),
        );

        await Promise.all(authOperations);
        console.log(`✓ Seeded ${allUsers.length} users with auth claims`);
    }
}
