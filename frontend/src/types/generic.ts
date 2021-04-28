export type NumberTuple = [number, number];

export interface IForm extends Element {
    validate: () => Promise<boolean>;
}

export type ValueOf<T> = T[keyof T];
