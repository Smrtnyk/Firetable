export type NumberTuple = [number, number];
export type AnyFunction = (...args: any[]) => any;
export type VoidFunction = (...args: any[]) => void;

export type DeepRequired<T> = {
    [P in keyof T]-?: T[P] extends object
        ? T[P] extends AnyFunction
            ? T[P]
            : DeepRequired<T[P]>
        : T[P];
};

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown>
        ? T[P] extends AnyFunction
            ? T[P]
            : DeepPartial<T[P]>
        : T[P];
};
