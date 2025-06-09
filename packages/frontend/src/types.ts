export interface DateRange {
    from: "" | IsoDateString;
    to: "" | IsoDateString;
}

export type GuardedLink = Link & { isVisible: boolean };

export type IsoDateString = `${number}-${string}-${string}`;
export type Link = {
    icon: string;
    label: string;
    route: { name: string; params?: Record<string, string> };
};

export type LinkWithChildren = Omit<Link, "route"> & { children: Link[]; isVisible: boolean };
