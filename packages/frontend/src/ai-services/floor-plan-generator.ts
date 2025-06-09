import type { Part } from "firebase/ai";

import { FloorElementTypes } from "@firetable/floor-creator";
import { getGenerativeModel, Schema } from "firebase/ai";
import { initializeFirebase } from "src/db";

const { ai } = initializeFirebase();

const FloorDimensionsSchema = Schema.object({
    properties: {
        height: Schema.number({ description: "The total height of the floor plan." }),
        width: Schema.number({ description: "The total width of the floor plan." }),
    },
    required: ["width", "height"],
});

const FloorElementPropertiesSchema = Schema.object({
    properties: {
        angle: Schema.number({ description: "The rotation angle of the element." }),
        height: Schema.number({ description: "The height of the element." }),
        label: Schema.string({
            description: "The text label for the element (e.g., table number).",
        }),
        width: Schema.number({ description: "The width of the element." }),
        x: Schema.number({ description: "The x-coordinate of the element's top-left corner." }),
        y: Schema.number({ description: "The y-coordinate of the element's top-left corner." }),
    },
    required: ["x", "y"],
});

const FloorElementSchema = Schema.object({
    properties: {
        properties: FloorElementPropertiesSchema,
        type: Schema.enumString({
            description: "The type of the element.",
            enum: [
                FloorElementTypes.WALL,
                FloorElementTypes.RECT_TABLE,
                FloorElementTypes.ROUND_TABLE,
                FloorElementTypes.DJ_BOOTH,
                FloorElementTypes.STAGE,
                FloorElementTypes.CLOAKROOM,
                FloorElementTypes.TEXT,
            ],
        }),
    },
    required: ["type", "properties"],
});

const FloorPlanResponseSchema = Schema.object({
    properties: {
        elements: Schema.array({
            description: "An array of all elements found on the floor plan.",
            items: FloorElementSchema,
        }),
        floorDimensions: FloorDimensionsSchema,
    },
    required: ["floorDimensions", "elements"],
});

const MAX_FLOOR_WIDTH = 1050;
const MAX_FLOOR_HEIGHT = 1500;

export interface AIGeneratedFloorPlan {
    elements: Array<{
        properties: {
            angle?: number;
            height?: number;
            label?: string;
            width?: number;
            x: number;
            y: number;
        };
        type: FloorElementTypes;
    }>;
    floorDimensions: { height: number; width: number };
}

/**
 * Analyzes a floor plan image file and returns a structured object representation.
 * @param imageFile The image file from an <input type="file"> element.
 */
export async function generateFloorPlanFromImage(imageFile: File): Promise<AIGeneratedFloorPlan> {
    const model = getGenerativeModel(ai, {
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: FloorPlanResponseSchema,
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
        },
        model: "gemini-2.5-pro-preview-06-05",
    });

    const prompt = createFloorplanPrompt();
    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    if (!text) {
        throw new Error("No text in response");
    }

    const floorPlanObject = JSON.parse(text) as AIGeneratedFloorPlan;

    if (!floorPlanObject.floorDimensions || !floorPlanObject.elements) {
        throw new Error("Invalid response structure");
    }

    return floorPlanObject;
}

function createFloorplanPrompt(): string {
    return `You are an expert floor plan analyst and digital architect. Analyze the provided image of a venue floor plan and convert it into a structured object.

    **Instructions:**
    1.  **Floor Dimensions:** Determine the aspect ratio of the entire floor plan. Scale these dimensions to fit within a maximum width of ${MAX_FLOOR_WIDTH} units and a maximum height of ${MAX_FLOOR_HEIGHT} units, while maintaining the correct aspect ratio.
    2.  **Element Analysis:** Identify all architectural and furniture elements in the floor plan:
        - ${FloorElementTypes.WALL}: Structural walls or partitions
        - ${FloorElementTypes.RECT_TABLE}: Rectangular or square tables
        - ${FloorElementTypes.ROUND_TABLE}: Circular tables
        - ${FloorElementTypes.DJ_BOOTH}: DJ equipment area, don't set labels for DJ booth
        - ${FloorElementTypes.STAGE}: Performance stage or platform, don't set labels for stage
        - ${FloorElementTypes.CLOAKROOM}: Coat check or storage area
        - ${FloorElementTypes.TEXT}: Any standalone text labels or signage, which excludes table elements which are already handled as tables
    3.  **Coordinate System:** All coordinates (x, y) and dimensions must be relative to the final scaled floor dimensions. The top-left corner is the origin (0,0).
    4.  **Element Properties:**
        - x, y: Position coordinates (required for all elements)
        - width, height: Dimensions for rectangular elements
        - angle: Rotation in degrees (0-360)
        - label: Text content for tables or text elements, for tables, if there is no label, start from 1 and autoincrement using numbers only.
    5.  **Schema Compliance:** Your entire output must strictly conform to the provided JSON schema.
    Ignore any elements that do not fit the specified types or properties.
    If you see something resembling chairs, ignore them and do not include them in the output.
    If there are chairs around tables ignore chairs and only include the tables.

    Focus on accuracy and ensure all elements are positioned correctly relative to each other matching the positioning from the picture.`;
}

/**
 * Converts a File object to the format required by the Firebase AI SDK.
 * @param file The image file from an <input> element.
 */
async function fileToGenerativePart(file: File): Promise<Part> {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}
