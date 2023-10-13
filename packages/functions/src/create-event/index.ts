import * as functions from "firebase-functions";
import { db, storage } from "../init.js";
import stream from "stream";
import { Collection, CreateEventPayload } from "../../types/types.js";

const { logger } = functions;

export async function createEvent(
    eventPayload: CreateEventPayload,
    context: functions.https.CallableContext
): Promise<string> {

    // Check for the presence of floors.
    if (!eventPayload.floors || eventPayload.floors.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Floors data is required.");
    }

    // Authentication check.
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "The function must be called while authenticated.");
    }

    const { date, img, floors, entryPrice, guestListLimit, name, propertyId } = eventPayload;
    const id = db.collection(Collection.EVENTS).doc().id;
    logger.info(`Creating event with ID: ${id}`);

    const creator = context.auth?.token?.email;
    let uploadedImg: string | null = null;

    if (img) {
        const base64EncodedImageString = img.split(",")[1];
        uploadedImg = await uploadFile(
            `${Collection.EVENTS}/${id}`,
            base64EncodedImageString
        );
    }

    return db.runTransaction(async transaction => {
        const eventRef = db.collection(Collection.EVENTS).doc(id);

        transaction.set(eventRef, {
            name,
            entryPrice,
            date: getTimestampFromDateString(date),
            img: uploadedImg,
            creator,
            reservedPercentage: 0,
            guestListLimit,
            propertyId
        });

        floors.forEach(floor => {
            if (floor.id) {
                const floorRef = eventRef.collection(Collection.FLOORS).doc(floor.id);
                transaction.set(floorRef, floor);
            } else {
                throw new functions.https.HttpsError("invalid-argument", "Invalid floor data provided.");
            }
        });

        return id;
    });
}

function getTimestampFromDateString(dateString: string): number {
    const [date, time] = dateString.split(" ");
    const [day, month, year] = date.split("-");
    const [hours, minutes] = time.split(":");
    return new Date(+year, +month - 1, +day, +hours, +minutes).getTime();
}

async function uploadFile(
    destination: string,
    content: string
): Promise<string> {
    const file = storage.file(destination);
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(content, "base64"));

    return new Promise((resolve, reject) => {
        bufferStream
            .pipe(
                file.createWriteStream({
                    metadata: {
                        contentType: "image/jpeg", // Consider dynamically setting this based on the image type.
                    },
                })
            )
            .on("error", reject)
            .on("finish", async () => {
                const [response] = await file.getSignedUrl({
                    action: "read",
                    expires: "03-09-2491",
                });
                resolve(response);
            });
    });
}
