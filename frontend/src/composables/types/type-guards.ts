import { Docref, CollectionRef } from "./firestoreTypes";
import { Options, OptionsCollWatch, OptionsCollGet, OptionsDocGet } from "./Options";

export function firestoreRefIsDoc(firestoreRef: CollectionRef | Docref): firestoreRef is Docref {
    return firestoreRef.path.split("/").length % 2 === 0;
}

export function optsAreColl<T, M>(
    options: Options<T, M>
): options is OptionsCollWatch<T, M> | OptionsCollGet<T, M> {
    return options.queryType === "collection";
}

export function optsAreGetColl<T, M>(options: Options<T, M>): options is OptionsCollGet<T, M> {
    return options.queryType === "collection" && options.type === "get";
}

export function optsAreWatchColl<T, M>(options: Options<T, M>): options is OptionsCollWatch<T, M> {
    return options.queryType === "collection" && options.type === "watch";
}

export function optsAreGetDoc<T, M>(options: Options<T, M>): options is OptionsDocGet<T, M> {
    return options.queryType === "doc" && options.type === "get";
}

export function optsAreGet<T, M>(
    options: Options<T, M>
): options is OptionsDocGet<T, M> | OptionsCollGet<T, M> {
    return options.type === "get";
}
