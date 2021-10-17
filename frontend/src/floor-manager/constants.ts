import { ElementTag, ElementType } from "src/types";

export const TABLE_ACTIONS = [
    {
        label: "Delete",
        icon: "trash",
        id: "delete",
        color: "negative",
    },
    {
        label: "Edit",
        icon: "pencil",
        id: "edit",
    },
];

export const ELEMENTS_TO_ADD_COLLECTION = [
    {
        label: "Add square table",
        icon: "img:svg-images/square-table.svg",
        elementDescriptor: {
            type: ElementType.TABLE,
            tag: ElementTag.RECT,
        },
    },
    {
        label: "Add round table",
        icon: "img:svg-images/round-table.svg",
        elementDescriptor: {
            type: ElementType.TABLE,
            tag: ElementTag.CIRCLE,
        },
    },
    {
        label: "Add a wall",
        icon: "img:svg-images/wall.svg",
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
