import { LocalStorage } from "quasar";

export function getDarkMode(): boolean {
    return (
        LocalStorage.getItem("FTDarkMode") ??
        globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    );
}
