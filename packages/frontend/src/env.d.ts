declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;
        VUE_ROUTER_BASE: string | undefined;
        VUE_ROUTER_MODE: "abstract" | "hash" | "history" | undefined;
    }
}

interface ImportMeta {
    readonly env: ImportMetaEnv;

    readonly glob: <T = unknown>(
        pattern: string | string[],
        options?: {
            eager?: boolean;
            import?: "default" | "raw";
            query?: Record<string, boolean | number | string> | string;
        },
    ) => Record<string, (() => Promise<T>) | T>;
}

interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
}
