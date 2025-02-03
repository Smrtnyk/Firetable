export interface DateRange {
    endDate: string;
    startDate: string;
}

export type GuardedLink = Link & { isVisible: boolean };
export type Link = {
    icon: string;
    label: string;
    route: { name: string; params?: Record<string, string> };
};

export type LinkWithChildren = Omit<Link, "route"> & { children: Link[]; isVisible: boolean };
