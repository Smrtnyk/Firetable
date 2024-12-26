export type NumberTuple = [number, number];
export type AnyFunction = (...args: any[]) => any;
export type VoidFunction = (...args: any[]) => void;

export type DeepRequired<T> = Required<{
    [K in keyof T]: T[K] extends Required<T[K]> ? T[K] : DeepRequired<T[K]>;
}>;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown>
        ? T[P] extends AnyFunction
            ? T[P]
            : DeepPartial<T[P]>
        : T[P];
};
