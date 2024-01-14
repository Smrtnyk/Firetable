import { FloorElementTypes } from "@firetable/floor-creator";

export const ELEMENTS_TO_ADD_COLLECTION = [
    {
        label: "Rectangle",
        img: "/svg-images/rectangle.svg",
        elementDescriptor: {
            tag: FloorElementTypes.EDITABLE_RECT,
        },
    },
    {
        label: "Circle",
        img: "/svg-images/circle.svg",
        elementDescriptor: {
            tag: FloorElementTypes.EDITABLE_CIRCLE,
        },
    },
    {
        label: "Square table",
        img: "/svg-images/square-table.svg",
        elementDescriptor: {
            tag: FloorElementTypes.RECT_TABLE,
        },
    },
    {
        label: "Round table",
        img: "/svg-images/round-table.svg",
        elementDescriptor: {
            tag: FloorElementTypes.ROUND_TABLE,
        },
    },
    {
        label: "Wall",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            tag: FloorElementTypes.WALL,
        },
    },
    {
        label: "Sofa",
        img: "/svg-images/double-sofa.svg",
        elementDescriptor: {
            tag: FloorElementTypes.SOFA,
        },
    },
    {
        label: "DJ Booth",
        img: "/svg-images/dj-booth.svg",
        elementDescriptor: {
            tag: FloorElementTypes.DJ_BOOTH,
        },
    },
    {
        label: "Stage",
        img: "/svg-images/disco-stage.svg",
        elementDescriptor: {
            tag: FloorElementTypes.STAGE,
        },
    },
    {
        label: "Door",
        img: "/svg-images/door.svg",
        elementDescriptor: {
            tag: FloorElementTypes.DOOR,
        },
    },
];
