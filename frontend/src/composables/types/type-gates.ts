import { Docref, CollectionRef } from "./firestoreTypes";
import {
    Options,
    OptionsCollWatch,
    OptionsCollGet,
    OptionsDocGet,
} from "./Options";

export const firestoreRefIsDoc = (
    firestoreRef: CollectionRef | Docref
): firestoreRef is Docref => {
    return firestoreRef.path.split("/").length % 2 === 0;
};

export const optsAreColl = <T, M>(
    o: Options<T, M>
): o is OptionsCollWatch<T, M> | OptionsCollGet<T, M> =>
    o.queryType === "collection";

export const optsAreGet = <T, M>(
    o: Options<T, M>
): o is OptionsDocGet<T, M> | OptionsCollGet<T, M> =>
    o.queryType === "doc" && o.type === "get";
