import { matchesValue } from "./matches-value";
import { not } from "./not";
import { propIsTruthy } from "./prop-is-truthy";
import { takeLast } from "./take-last";
import { takeProp } from "./take-prop";

export * from "./type-guards";
export { takeLast, not, propIsTruthy, takeProp, matchesValue };

export function NOOP() {
    /* EMPTY */
}
