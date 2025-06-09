import type { Store, StoreDefinition } from "pinia";
import type { Mock } from "vitest";
import type { UnwrapRef } from "vue";

export function mockedStore<TStoreDef extends () => unknown>(
    useStore: TStoreDef,
): TStoreDef extends StoreDefinition<infer Id, infer State, infer Getters, infer Actions>
    ? Store<
          Id,
          State,
          Record<string, never>,
          {
              [K in keyof Actions]: Actions[K] extends (...args: any[]) => any
                  ? Mock<Actions[K]>
                  : Actions[K];
          }
      > & {
          [K in keyof Getters]: UnwrapRef<Getters[K]>;
      }
    : ReturnType<TStoreDef> {
    return useStore() as any;
}
