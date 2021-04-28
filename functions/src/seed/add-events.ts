import { db } from "../init";
import * as faker from "faker";

const NUM_OF_FAKE_DATA = 100;
const NUM_OF_FAKE_EVENTS = 30;

async function addEvents(): Promise<void> {
    try {
        const eventsDoc = db.collection("DEV_events");
        const floors = db.collection("floors");
        const floorDocs = await floors.listDocuments();
        const ids = floorDocs.map((doc) => doc.id);

        for (let i = 0; i < NUM_OF_FAKE_EVENTS; i++) {
            await eventsDoc.add({
                name: faker.company.catchPhraseNoun(),
                date: faker.date.future().getTime(),
                creator: faker.name.firstName(),
                entryPrice: faker.random.number(NUM_OF_FAKE_DATA),
                guestListLimit: faker.random.number(NUM_OF_FAKE_DATA),
                floorIds: ids,
                img: faker.image.nightlife()
            });
        }
        process.exit();
    } catch (e) {
        console.log(e.message ?? e);
        process.exit(1);
    }
}

addEvents();
