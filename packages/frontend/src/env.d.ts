declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;
        VUE_ROUTER_MODE: "abstract" | "hash" | "history" | undefined;
        VUE_ROUTER_BASE: string | undefined;
        SERVICE_WORKER_FILE: string;
    }
}
