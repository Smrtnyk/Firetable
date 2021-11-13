import { ElementTag, ElementType } from "src/types/floor";

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
];

export const TABLE_WIDTH = 30;
export const TABLE_HEIGHT = 30;
export const RESOLUTION = 5;
export const FLOOR_DEFAULT_WIDTH = 400;
export const FLOOR_DEFAULT_HEIGHT = 650;
export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = 60 * ONE_MINUTE;
