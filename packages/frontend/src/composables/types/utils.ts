import { Ref } from "vue";
import { OptionsBase } from "src/composables/types/Options";
import { DocumentSnapshot } from "firebase/firestore";

export function firestoreDocSerializer<T>(docToSerialize: DocumentSnapshot): T {
    const data = docToSerialize.data() || {};
    return { id: docToSerialize.id, ...data } as unknown as T;
}

export function withError<T extends (...args: unknown[]) => unknown>(
    errorHandler: OptionsBase["onError"],
    fn: T
): (...args: Parameters<T>) => ReturnType<T> | void {
    return function (...args: Parameters<T>): ReturnType<T> | void {
        try {
            // @ts-expect-error will be inferred on usage
            return fn(...args);
        } catch (e) {
            errorHandler?.(e);
        }
    };
}

export function calculatePath(
    path: string,
    variables?: Record<string, Ref<string | number>>
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
            return newPath.substring(1).substring(0, newPath.length - 2);
        }
        return newPath.substring(1);
    }
    return newPath;
}
