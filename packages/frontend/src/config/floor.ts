import { ElementTag, ElementType } from "@firetable/types";

export const ELEMENTS_TO_ADD_COLLECTION = [
    {
        label: "Add square table",
        img: "/svg-images/square-table.svg",
        elementDescriptor: {
            type: ElementType.TABLE,
            tag: ElementTag.RECT,
        },
    },
    {
        label: "Add round table",
        img: "/svg-images/round-table.svg",
        elementDescriptor: {
            type: ElementType.TABLE,
            tag: ElementTag.CIRCLE,
        },
    },
    {
        label: "Add a wall",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            type: ElementType.WALL,
            tag: ElementTag.RECT,
        },
    },
    {
        label: "Add a Sofa",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            type: ElementType.SOFA,
            tag: ElementTag.SOFA,
        },
    },
    {
        label: "Add DJ Booth",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            type: ElementType.DJ_BOOTH,
            tag: ElementTag.DJ_BOOTH,
        },
    },
];
