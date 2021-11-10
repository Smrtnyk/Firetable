import { OptionsCollection, OptionsCollGet, OptionsDocGet, OptionsDocument } from "./Options";

export function optsAreGetColl<T, M>(
    options: OptionsCollection<T, M>
): options is OptionsCollGet<T, M> {
    return options.type === "get";
}

export function optsAreGetDoc<T, M>(
    options: OptionsDocument<T, M>
): options is OptionsDocGet<T, M> {
    return options.type === "get";
}
