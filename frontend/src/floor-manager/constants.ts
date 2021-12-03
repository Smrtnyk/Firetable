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

export const TABLE_WIDTH = 50;
export const TABLE_HEIGHT = 50;
export const RESOLUTION = 50;
export const FLOOR_DEFAULT_WIDTH = 1000;
export const FLOOR_DEFAULT_HEIGHT = 1000;

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = 60 * ONE_MINUTE;

export const INITIAL_WALL_HEIGHT = RESOLUTION * 5;
