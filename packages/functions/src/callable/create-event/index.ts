import * as functions from "firebase-functions";
import { db, storage } from "../../init.js";
import stream from "stream";
import { Collection, CreateEventPayload } from "../../../types/types.js";

const { logger } = functions;
const JPEG_CONTENT_TYPE = "image/jpeg"; // Consider dynamically setting this based on the image type.

/**
 * Creates a new event in the Firestore database, uploads associated event images, and associates the event with specific floor plans.
 *
 * @param eventPayload - The payload containing details for the event creation.
 * @param eventPayload.date - The date and time of the event in the format "DD-MM-YYYY HH:mm".
 * @param eventPayload.img - The base64 encoded image string for the event.
 * @param eventPayload.floors - An array of floor objects associated with the event. Each floor object must have an ID.
 * @param eventPayload.entryPrice - The entry price for the event.
 * @param eventPayload.guestListLimit - The limit for the guest list for the event.
 * @param eventPayload.name - The name of the event.
 * @param eventPayload.propertyId - The ID of the property associated with the event.
 * @param context - The context of the callable function, provided by Firebase Functions.
 *                                                   This includes details about the authenticated user making the request.
 *
 * @throws - Throws an "invalid-argument" error if no floors are provided.
 * @throws - Throws a "failed-precondition" error if the user is not authenticated.
 * @throws - Throws an "invalid-argument" error if any floor does not have an ID.
 *
 * @returns A promise that resolves to the ID of the newly created event.
 *
 * @description
 * This function does the following:
 * 1. Validates the presence of floors and the authentication of the user.
 * 2. Generates a unique ID for the event.
 * 3. If an image is provided, uploads the image to Firebase Storage.
 * 4. In a transaction, creates a new event document with the provided data.
 * 5. Associates the event with the provided floors.
 */
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

    const creator = context.auth.token.email;
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

/**
 * Converts a date string of the format "DD-MM-YYYY HH:mm" to a Unix timestamp (milliseconds since the Unix Epoch).
 *
 * @param dateString - The date string in the format "DD-MM-YYYY HH:mm".
 * @returns - The Unix timestamp representation of the provided date string.
 */
function getTimestampFromDateString(dateString: string): number {
    const [date, time] = dateString.split(" ");
    const [day, month, year] = date.split("-");
    const [hours, minutes] = time.split(":");
    return new Date(+year, +month - 1, +day, +hours, +minutes).getTime();
}

/**
 * Uploads a base64 encoded image string to Firebase Storage and returns a signed URL for the uploaded image.
 *
 * @param destination - The destination path in Firebase Storage where the image should be uploaded.
 * @param content - The base64 encoded image string.
 *
 * @returns - A promise that resolves to a signed URL for the uploaded image.
 *
 * @throws - Throws an error if there's an issue during the upload or signed URL generation process.
 *
 * @description
 * The function does the following:
 * 1. Decodes the base64 image string.
 * 2. Creates a write stream to Firebase Storage for the image upload.
 * 3. Once the upload is complete, generates a signed URL for the uploaded image.
 */
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
                        contentType: JPEG_CONTENT_TYPE,
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
