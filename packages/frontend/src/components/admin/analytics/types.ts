import type { BarSeriesOption, PieSeriesOption } from "echarts/charts";
import type {
    DatasetComponentOption,
    GridComponentOption,
    LegendComponentOption,
    TitleComponentOption,
    TooltipComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";

export type ECBarOption = ComposeOption<
    | BarSeriesOption
    | DatasetComponentOption
    | GridComponentOption
    | LegendComponentOption
    | TitleComponentOption
    | TooltipComponentOption
>;
export type ECPieOption = ComposeOption<
    LegendComponentOption | PieSeriesOption | TitleComponentOption | TooltipComponentOption
>;

export type PieChartData = {
    itemStyle?: {
        color?: string;
    };
    name: string;
    value: number;
}[];

export type TimeSeriesData = {
    data: number[];
    itemStyle: BarItemStyleOption;
    name: string;
    stack?: BarItemStackOption;
}[];

type BarItemStackOption = NonNullable<BarSeriesOption["stack"]>;

type BarItemStyleOption = NonNullable<BarSeriesOption["itemStyle"]>;
