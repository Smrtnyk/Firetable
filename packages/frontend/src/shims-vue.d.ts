/// <reference types="vite/client" />
/// <reference types="vue/ref-macros" />

// Mocks all files ending in `.vue` showing them as plain Vue instances
declare module "*.vue" {
    import type { defineComponent } from "vue";
    const component: ReturnType<typeof defineComponent>;
    export default component;
}
