export type Link = {
    label: string;
    icon: string;
    route: { name: string; params?: Record<string, string> };
};

export type GuardedLink = Link & { isVisible: boolean };
export type LinkWithChildren = Omit<Link, "route"> & { children: Link[]; isVisible: boolean };
