import { Ref } from "vue";
import { OptionsBase } from "src/composables/types/Options";

export function withError<T extends (...args: any[]) => any>(
    errorHandler: OptionsBase["onError"],
    fn: T
) {
    return function (...args: Parameters<T>): ReturnType<T> | undefined {
        try {
            return fn(...args);
        } catch (e) {
            errorHandler?.(e);
        }
    };
}

export function calculatePath(
    path: string,
    variables?: {
        [key: string]: Ref<string | number>;
    }
): string {
    const stringVars = path.replace(/\s/g, "").match(/\$[^\W]*/g);
    if (!stringVars?.length || !variables) return path;
    let newPath = path;
    for (const x of stringVars) {
        const instanceVal = variables[x.split("$").join("")].value;
        if (!["number", "string"].includes(typeof instanceVal) || instanceVal === "") {
            newPath = "";
            break;
        } else {
            newPath = newPath.replace(x, `${instanceVal}`);
        }
    }
    if (newPath.startsWith("/")) {
        if (newPath.endsWith("/")) {
            return newPath.substr(1).substr(0, newPath.length - 2);
        }
        return newPath.substr(1);
    }
    return newPath;
}
