export type Link = {
    label: string;
    icon: string;
    route: { name: string; params: Record<string, string> };
};
