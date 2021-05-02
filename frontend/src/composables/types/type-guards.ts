import { Docref, CollectionRef } from "./firestoreTypes";
import {
    Options,
    OptionsCollWatch,
    OptionsCollGet,
    OptionsDocGet,
} from "./Options";

export function firestoreRefIsDoc(
    firestoreRef: CollectionRef | Docref
): firestoreRef is Docref {
    return firestoreRef.path.split("/").length % 2 === 0;
}

export function optsAreColl<T, M>(
    options: Options<T, M>
): options is OptionsCollWatch<T, M> | OptionsCollGet<T, M> {
    return options.queryType === "collection";
}

export function optsAreGet<T, M>(
    options: Options<T, M>
): options is OptionsDocGet<T, M> | OptionsCollGet<T, M> {
    return options.queryType === "doc" && options.type === "get";
}
