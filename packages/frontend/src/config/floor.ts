import { FloorElementTypes } from "@firetable/floor-creator";
import { i18n } from "src/boot/i18n";

export const ELEMENTS_TO_ADD_COLLECTION = [
    {
        img: "/svg-images/rectangle.svg",
        label: i18n.global.t('config.floorElements.rectangle'),
        tag: FloorElementTypes.EDITABLE_RECT,
    },
    {
        img: "/svg-images/circle.svg",
        label: i18n.global.t('config.floorElements.circle'),
        tag: FloorElementTypes.EDITABLE_CIRCLE,
    },
    {
        img: "/svg-images/square-table.svg",
        label: i18n.global.t('config.floorElements.squareTable'),
        tag: FloorElementTypes.RECT_TABLE,
    },
    {
        img: "/svg-images/round-table.svg",
        label: i18n.global.t('config.floorElements.roundTable'),
        tag: FloorElementTypes.ROUND_TABLE,
    },
    {
        img: "/svg-images/wall.svg",
        label: i18n.global.t('config.floorElements.wall'),
        tag: FloorElementTypes.WALL,
    },
    {
        img: "/svg-images/double-sofa.svg",
        label: i18n.global.t('config.floorElements.sofa'),
        tag: FloorElementTypes.SOFA,
    },
    {
        img: "/svg-images/dj-booth.svg",
        label: i18n.global.t('config.floorElements.djBooth'),
        tag: FloorElementTypes.DJ_BOOTH,
    },
    {
        img: "/svg-images/disco-stage.svg",
        label: i18n.global.t('config.floorElements.stage'),
        tag: FloorElementTypes.STAGE,
    },
    {
        img: "/svg-images/door.svg",
        label: i18n.global.t('config.floorElements.door'),
        tag: FloorElementTypes.DOOR,
    },
    {
        img: "/svg-images/cocktail.svg",
        label: i18n.global.t('config.floorElements.bar'),
        tag: FloorElementTypes.BAR,
    },
    {
        img: "/svg-images/jacket.svg",
        label: i18n.global.t('config.floorElements.cloakroom'),
        tag: FloorElementTypes.CLOAKROOM,
    },
    {
        label: i18n.global.t('config.floorElements.text'),
        tag: FloorElementTypes.TEXT,
    },
];
