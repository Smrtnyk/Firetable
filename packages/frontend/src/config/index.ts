import { LocalStorage, Lang } from "quasar";
import { AppLogger } from "src/logger/FTLogger";

export const myIcons: Record<string, string> = {
    chevron_left: "svguse:/svg-icons/ft-icons.svg#chevron-left",
    chevron_right: "svguse:/svg-icons/ft-icons.svg#chevron-right",
    chevron_double_right: "svguse:/svg-icons/ft-icons.svg#chevron-double-right",
    chevron_down: "svguse:/svg-icons/ft-icons.svg#chevron-down",
    chevron_up: "svguse:/svg-icons/ft-icons.svg#chevron-up",
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
    clock: "svguse:/svg-icons/ft-icons.svg#clock",
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
    copy: "svguse:/svg-icons/ft-icons.svg#copy",
    grid: "svguse:/svg-icons/ft-icons.svg#grid",
    stack: "svguse:/svg-icons/ft-icons.svg#stack",
    "color-picker": "svguse:/svg-icons/ft-icons.svg#color-picker",
    undo: "svguse:/svg-icons/ft-icons.svg#undo",
    redo: "svguse:/svg-icons/ft-icons.svg#redo",
    export: "svguse:/svg-icons/ft-icons.svg#export",
    import: "svguse:/svg-icons/ft-icons.svg#import",
    "full-screen": "svguse:/svg-icons/ft-icons.svg#full-screen",
    transfer: "svguse:/svg-icons/ft-icons.svg#transfer",
    "line-chart": "svguse:/svg-icons/ft-icons.svg#line-chart",
    dash: "svguse:/svg-icons/ft-icons.svg#dash",
    crown: "svguse:/svg-icons/ft-icons.svg#crown",
    "cog-wheel": "svguse:/svg-icons/ft-icons.svg#cog-wheel",
    "send-backward": "svguse:/svg-icons/ft-icons.svg#send-backward",
    bookmark: "svguse:/svg-icons/ft-icons.svg#bookmark",
    "users-list": "svguse:/svg-icons/ft-icons.svg#users-list",
    list: "svguse:/svg-icons/ft-icons.svg#list",
    "dashed-outline": "svguse:/svg-icons/ft-icons.svg#dashed-outline",
    fill: "svguse:/svg-icons/ft-icons.svg#fill",
    filter: "svguse:/svg-icons/ft-icons.svg#filter",
    "arrow-sort-up": "svguse:/svg-icons/ft-icons.svg#arrow-sort-up",
    "arrow-sort-down": "svguse:/svg-icons/ft-icons.svg#arrow-sort-down",
    link: "svguse:/svg-icons/ft-icons.svg#link",
    unlink: "svguse:/svg-icons/ft-icons.svg#unlink",
    download: "svguse:/svg-icons/ft-icons.svg#download",
    bug: "svguse:/svg-icons/ft-icons.svg#bug",
    more: "svguse:/svg-icons/ft-icons.svg#more",
};

export function getDarkMode(): boolean {
    return (
        LocalStorage.getItem("FTDarkMode") ??
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

export function getPersistedLang(): string | undefined {
    return (LocalStorage.getItem("FTLang") as string) ?? undefined;
}

export function dynamicallySwitchLang(langIso: string): void {
    if (langIso) {
        import(`../../node_modules/quasar/lang/${langIso}.js`)
            .then(function (langModule) {
                return Lang.set(langModule.default);
            })
            .catch(AppLogger.error.bind(AppLogger));
    }
}
