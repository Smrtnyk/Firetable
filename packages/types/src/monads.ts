export function isSome<T>(option: Option<T>): option is Some<T> {
    return option.kind === "someOption";
}
export function isNone<T>(option: Option<T>): option is None {
    return option.kind === "noneOption";
}
export interface Some<T> {
    kind: "someOption";
    value: T;
}
export interface None {
    kind: "noneOption";
}
export type Option<T> = Some<T> | None;
export function Some<T>(value: T): Some<T> {
    return { kind: "someOption", value };
}
export function None(): None {
    return { kind: "noneOption" };
}
