import { LocalStorage } from "quasar";

interface Config {
    maxNumOfUsers: number;
    eventDuration: number;
}

export const config: Config = {
    maxNumOfUsers: 10,
    eventDuration: 8,
};

export const PROJECT_MAIL = "@firetable.at";

export const myIcons: Record<string, string> = {
    chevron_left: "svguse:/svg-icons/ft-icons.svg#chevron-left",
    chevron_right: "svguse:/svg-icons/ft-icons.svg#chevron-right",
    chevron_double_right: "svguse:/svg-icons/ft-icons.svg#chevron-double-right",
    chevron_down: "svguse:/svg-icons/ft-icons.svg#chevron-down",
    arrow_drop_down: "svguse:/svg-icons/ft-icons.svg#chevron-down",
    close: "svguse:/svg-icons/ft-icons.svg#close",
    save: "svguse:/svg-icons/ft-icons.svg#save",
    pencil: "svguse:/svg-icons/ft-icons.svg#pencil",
    check: "svguse:/svg-icons/ft-icons.svg#check",
    trash: "svguse:/svg-icons/ft-icons.svg#trash",
    search: "svguse:/svg-icons/ft-icons.svg#search",
    key: "svguse:/svg-icons/ft-icons.svg#key",
    "at-symbol": "svguse:/svg-icons/ft-icons.svg#at-symbol",
    calendar: "svguse:/svg-icons/ft-icons.svg#calendar",
    clock: "svguse:svg-icons/ft-icons.svg#clock",
    logout: "svguse:/svg-icons/ft-icons.svg#logout",
    users: "svguse:/svg-icons/ft-icons.svg#users",
    "eye-open": "svguse:/svg-icons/ft-icons.svg#eye-open",
    "eye-off": "svguse:/svg-icons/ft-icons.svg#eye-off",
    "user-circle": "svguse:/svg-icons/ft-icons.svg#user-circle",
    moon: "svguse:/svg-icons/ft-icons.svg#moon",
    sun: "svguse:/svg-icons/ft-icons.svg#sun",
    euro: "svguse:/svg-icons/ft-icons.svg#euro",
    "status-online": "svguse:/svg-icons/ft-icons.svg#status-online",
    "status-offline": "svguse:/svg-icons/ft-icons.svg#status-offline",
    plus: "svguse:/svg-icons/ft-icons.svg#plus",
    "arrow-expand": "svguse:/svg-icons/ft-icons.svg#arrow-expand",
    menu: "svguse:/svg-icons/ft-icons.svg#menu",
    home: "svguse:/svg-icons/ft-icons.svg#home",
    selector: "svguse:/svg-icons/ft-icons.svg#selector",
    error: "svguse:/svg-icons/ft-icons.svg#error",
    fire: "svguse:/svg-icons/ft-icons.svg#fire",
    camera: "svguse:/svg-icons/ft-icons.svg#camera",
    info: "svguse:/svg-icons/ft-icons.svg#info",
};

export function getDarkMode(): boolean {
    return LocalStorage.getItem("FTDarkMode") ?? false;
}
