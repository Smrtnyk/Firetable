import * as functions from "firebase-functions";
import { db, storage } from "../init.js";
import stream from "stream";
import { Collection, CreateEventPayload } from "@firetable/types";

const { logger } = functions;

export async function createEvent(
    eventPayload: CreateEventPayload,
    context: functions.https.CallableContext
): Promise<string> {
    if (!eventPayload.floors) {
        return "";
    }

    // Checking that the user is authenticated.
    if (!context.auth) {
        // Throwing an HttpsError so that the client gets the error details.
        throw new functions.https.HttpsError("failed-precondition", "The function must be called while authenticated.");
    }

    const { date, img, floors, entryPrice, guestListLimit, name } = eventPayload;
    const id = db.collection(Collection.EVENTS).doc().id;
    logger.info(id);
    const creator = context.auth?.token?.email;
    let uploadedImg = null;

    if (img) {
        const base64EncodedImageString = img.split(",")[1];
        uploadedImg = await uploadFile(
            `${Collection.EVENTS}/${id}`,
            base64EncodedImageString
        );
    }

    const eventPromise = db
        .collection(Collection.EVENTS)
        .doc(id)
        .set({
            name,
            entryPrice,
            date: getTimestampFromDateString(date),
            img: uploadedImg,
            creator,
            reservedPercentage: 0,
            guestListLimit,
        });

    const floorsPromises = floors.map(function (floor) {
        return floor &&
        db
            .collection(Collection.EVENTS)
            .doc(id)
            .collection("floors")
            .doc(floor.id)
            .set(floor);
    });

    await Promise.all([eventPromise, ...floorsPromises]);

    return id;
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
                        contentType: "image/jpeg",
                    },
                })
            )
            .on("error", reject)
            .on("finish", async () => {
                // The file upload is complete.
                const [response] = await file.getSignedUrl({
                    action: "read",
                    expires: "03-09-2491",
                });

                resolve(response);
            });
    });
}
