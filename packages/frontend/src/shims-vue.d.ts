// Mocks all files ending in `.vue` showing them as plain Vue instances
declare module "*.vue" {
    import type { DefineComponent } from "vue";
    // eslint-disable-next-line @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
