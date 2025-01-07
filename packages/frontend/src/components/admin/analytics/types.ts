import type {
    LegendComponentOption,
    TitleComponentOption,
    TooltipComponentOption,
    DatasetComponentOption,
    GridComponentOption,
} from "echarts/components";
import type { ComposeOption } from "echarts/core";
import type { BarSeriesOption, PieSeriesOption } from "echarts/charts";

type BarItemStyleOption = NonNullable<BarSeriesOption["itemStyle"]>;
type BarItemStackOption = NonNullable<BarSeriesOption["stack"]>;

export type PieChartData = {
    name: string;
    value: number;
    itemStyle?: {
        color?: string;
    };
}[];

export type ECPieOption = ComposeOption<
    LegendComponentOption | PieSeriesOption | TitleComponentOption | TooltipComponentOption
>;

export type TimeSeriesData = {
    name: string;
    data: number[];
    itemStyle: BarItemStyleOption;
    stack?: BarItemStackOption;
}[];

export type ECBarOption = ComposeOption<
    | BarSeriesOption
    | DatasetComponentOption
    | GridComponentOption
    | LegendComponentOption
    | TitleComponentOption
    | TooltipComponentOption
>;
