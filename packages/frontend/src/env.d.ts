declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;
        VUE_ROUTER_BASE: string | undefined;
        VUE_ROUTER_MODE: "abstract" | "hash" | "history" | undefined;
    }
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
}
