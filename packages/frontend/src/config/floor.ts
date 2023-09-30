import { ElementTag } from "@firetable/types";

export const ELEMENTS_TO_ADD_COLLECTION = [
    {
        label: "Add square table",
        img: "/svg-images/square-table.svg",
        elementDescriptor: {
            tag: ElementTag.RECT,
        },
    },
    {
        label: "Add round table",
        img: "/svg-images/round-table.svg",
        elementDescriptor: {
            tag: ElementTag.CIRCLE,
        },
    },
    {
        label: "Add a wall",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            tag: ElementTag.WALL,
        },
    },
    {
        label: "Add a Sofa",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            tag: ElementTag.SOFA,
        },
    },
    {
        label: "Add DJ Booth",
        img: "/svg-images/wall.svg",
        elementDescriptor: {
            tag: ElementTag.DJ_BOOTH,
        },
    },
];
