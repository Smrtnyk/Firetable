import { pointer, select, Selection } from "d3-selection";
import { range } from "d3-array";
import { RESOLUTION, SVG_NAMESPACE } from "./constants";
import {
    calculateBottomResizableCirclePositionX,
    calculateBottomResizableCirclePositionY,
    calculateTopResizableCirclePositionX,
    calculateTopResizableCirclePositionY,
    calculateWallWidth,
    generateTableClass,
    generateTableGroupClass,
    getDefaultElementWidth,
    getRoundTableRadius,
    getTableHeight,
    getTableText,
    getTableTextPosition,
    getTableWidth,
    isEditorModeActive,
    possibleXMove,
    possibleYMove,
    translateElementToItsPosition,
} from "./utils";
import { makeRawTable, makeRawWall } from "./factories";
import { BaseFloorElement, FloorMode, FloorDoc, TableElement } from "src/types";
import {
    isRoundTable,
    isSquaredTable,
    isTable,
    isWall,
} from "src/floor-manager/type-guards";
import { NOOP, whiteSpaceToUnderscore } from "src/helpers/utils";
import {
    baseElementGroupSelection,
    ElementClickHandler,
    FloorDoubleClickHandler,
    FTDragEvent,
    tableElementGroupSelection,
    tableElementInit,
} from "src/floor-manager/types";
import { getFreeTables, getTables } from "src/floor-manager/filters";
import { NumberTuple } from "src/types/generic";
import { zoom } from "d3-zoom";
import { D3DragEvent, drag } from "d3-drag";

interface FloorCreateOptions {
    floorDoc: Readonly<FloorDoc>;
    container: HTMLElement;
    mode: FloorMode;
    elementClickHandler: ElementClickHandler;
    dblClickHandler?: FloorDoubleClickHandler;
}

export class Floor {
    public svg!: Selection<SVGSVGElement, unknown, null, unknown>;
    public floor!: Selection<SVGGElement, unknown, null, unknown>;
    private _data: BaseFloorElement[];

    id: string;
    height: number;
    width: number;
    name: string;
    private readonly mode: FloorMode;
    private readonly dblClickHandler: FloorDoubleClickHandler;
    private readonly elementClickHandler: ElementClickHandler;
    private container: HTMLElement;

    constructor({
        floorDoc,
        container,
        mode,
        elementClickHandler = NOOP,
        dblClickHandler = NOOP,
    }: FloorCreateOptions) {
        if (!container) throw new Error("No container to render the svg");

        const floorCopy: FloorDoc = JSON.parse(JSON.stringify(floorDoc));
        const { name, width, height, data, id } = floorCopy;

        this.container = container;
        this.elementClickHandler = elementClickHandler;
        this.dblClickHandler = dblClickHandler;
        this.mode = mode;
        this.name = name;
        this.id = id;
        this.width = width;
        this.height = height;
        this._data = data;

        this.init();
    }

    get data() {
        return this._data;
    }

    set data(newData: BaseFloorElement[]) {
        this._data = JSON.parse(JSON.stringify(newData));
    }

    get tables(): TableElement[] {
        return getTables(this);
    }

    get freeTables(): TableElement[] {
        return getFreeTables(this);
    }

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;

        this.setSVGAttributes();
        this.setupEditor();
    }

    addWall([x, y]: NumberTuple) {
        this._data.push(makeRawWall(x, y));
        this.renderWallElements();
    }

    removeElement(element: BaseFloorElement) {
        this._data = this._data.filter((d) => d.id !== element.id);
        isTable(element)
            ? this.renderTableElements()
            : this.renderWallElements();
    }

    addTableElement(rawTableElement: tableElementInit) {
        this._data.push(
            makeRawTable({
                floor: this.name,
                ...rawTableElement,
            })
        );
        this.renderTableElements();
    }

    changeName(newName: string) {
        this.name = newName;
        this.tables.forEach((table) => (table.floor = newName));
    }

    renderWallElements() {
        const wallsData = this._data.filter(isWall);

        this.floor
            .selectAll("g.wallGroup")

            .data(wallsData)

            .join(
                // @ts-ignore 0 fucking idea what d3 types expect from me
                (enter: baseElementGroupSelection) => {
                    const wallG = enter
                        .append("g")
                        .attr("class", "wallGroup")
                        .attr("transform", translateElementToItsPosition);

                    wallG
                        .append("rect")
                        .attr("class", "wall")
                        .attr("height", (d) => d.height)
                        .attr("width", calculateWallWidth);

                    wallG.on("click", (event: Event, d: BaseFloorElement) => {
                        event.stopPropagation();
                        this.elementClickHandler(this, d);
                    });

                    if (isEditorModeActive(this.mode)) {
                        this.addDragBehaviourToElement(this, wallG);
                        this.addResizeBehaviorToElement(wallG);
                    }
                },
                (update: baseElementGroupSelection) => {
                    update.attr("transform", translateElementToItsPosition);
                    update
                        .select("rect.wall")
                        .attr("height", (d) => d.height)
                        .attr("width", calculateWallWidth);
                    update
                        .select(".bottomright")
                        .attr("cx", (d) => d.width)
                        .attr("cy", (d) => d.height);
                }
            );
    }

    renderTableElements() {
        this.floor
            .selectAll<SVGGElement, TableElement>("g.tableGroup")

            .data(this.tables, (d) => d.tableId)

            .join(
                // @ts-ignore I have 0 fucking idea how to type d3 styff
                (enter: tableElementGroupSelection) => {
                    const tableG = enter
                        .append("g")
                        .attr("class", generateTableGroupClass)
                        .attr("transform", translateElementToItsPosition);

                    const tables = tableG.append((d) =>
                        document.createElementNS(SVG_NAMESPACE, d.tag)
                    );

                    tables.each(this.eachTableDimensions);

                    tableG
                        .append("text")
                        .attr("transform", getTableTextPosition)
                        .attr("class", "table__id")
                        .text(getTableText);

                    tableG
                        .select(":first-child")
                        .attr("class", generateTableClass);

                    tableG.on("click", (event: Event, d: BaseFloorElement) => {
                        this.elementClickHandler(this, d);
                    });

                    if (isEditorModeActive(this.mode)) {
                        this.addResizeBehaviorToElement(
                            (tableG as unknown) as baseElementGroupSelection
                        );
                        this.addDragBehaviourToElement(
                            this,
                            (tableG as unknown) as baseElementGroupSelection
                        );
                    }
                },
                (update) => {
                    update.attr("transform", translateElementToItsPosition);
                    update
                        .select(".bottomright")
                        .attr("cx", calculateBottomResizableCirclePositionX)
                        .attr("cy", calculateBottomResizableCirclePositionY);
                    update
                        .select(".topleft")
                        .attr("cx", calculateTopResizableCirclePositionX)
                        .attr("cy", calculateTopResizableCirclePositionY);
                    update.select(".table").attr("class", generateTableClass);
                    update
                        .select("circle.table")
                        .attr("r", getRoundTableRadius);
                    update
                        .select("rect.table")
                        .attr("height", getTableHeight)
                        .attr("width", getTableWidth);
                    update
                        .select("text")
                        .attr("transform", getTableTextPosition)
                        .text(getTableText);
                }
            );
    }

    eachTableDimensions(this: SVGElement, d: TableElement) {
        const element = select<SVGElement, TableElement>(this);
        isRoundTable(d)
            ? element.attr("r", getRoundTableRadius)
            : element
                  .attr("height", getTableHeight)
                  .attr("width", getTableWidth);
    }

    addDragBehaviourToElement(
        instance: Floor,
        element: baseElementGroupSelection
    ) {
        const dragBehaviour = drag<Element, BaseFloorElement, Element>()
            .on("start", instance.elementDragStarted)
            .on("drag", elementDragging)
            .on("end", instance.elementDragEnded);

        dragBehaviour(element as any);

        function elementDragging(
            this: Element,
            { x, y }: DragEvent,
            d: BaseFloorElement
        ) {
            const gridX = possibleXMove(instance.width, x, d.width);
            const gridY = possibleYMove(instance.height, y, d.height);

            d.x = gridX;
            d.y = gridY;

            select(this).attr("transform", `translate(${gridX},${gridY})`);
        }
    }

    elementDragStarted(this: Element): void {
        select(this).classed("active", true);
    }

    elementDragEnded(this: Element): void {
        select(this).classed("active", false);
    }

    addResizeBehaviorToElement(element: baseElementGroupSelection) {
        element
            .append("g")
            .attr("class", "circles")
            .each(this.eachTableForResizeBehaviour(this));
    }

    eachTableForResizeBehaviour(instance: Floor) {
        return function (this: SVGGElement, d: BaseFloorElement) {
            const node = instance.floor?.node();
            if (!node) return;

            const circleG = select<SVGGElement, TableElement>(this);
            const dragBehaviour = drag<SVGGElement, BaseFloorElement, unknown>()
                .container(node)
                .subject(({ x, y }) => ({ x, y }))
                .on("start end", instance.elementResizeStartEnd)
                .on("drag", instance.elementResizing(instance));

            // On circular elements we do not need the upper resize handle
            if (!isRoundTable(d)) {
                circleG
                    .append("circle")
                    .attr("class", "topleft")
                    .attr("r", 2)
                    .attr("cx", calculateTopResizableCirclePositionX)
                    .attr("cy", calculateTopResizableCirclePositionY)
                    .on("mouseenter mouseleave", instance.resizerHover)
                    .call(dragBehaviour as any);
            }

            circleG
                .append("circle")
                .attr("class", "bottomright")
                .attr("r", 2)
                .attr("cx", calculateBottomResizableCirclePositionX)
                .attr("cy", calculateBottomResizableCirclePositionY)
                .on("mouseenter mouseleave", instance.resizerHover)
                .call(dragBehaviour as any);
        };
    }

    elementResizing(instance: Floor) {
        return function (event: FTDragEvent, d: BaseFloorElement) {
            const { x, y } = event;
            const gridX = possibleXMove(instance.width + d.width, x, d.width);
            const gridY = possibleYMove(
                instance.height + d.height,
                y,
                d.height
            );
            const draggedElement = event.sourceEvent.target;

            if (draggedElement.classList.contains("topleft")) {
                const newWidth = Math.max(
                    d.width + d.x - gridX,
                    getDefaultElementWidth(d)
                );
                const newHeight = Math.max(
                    d.height + d.y - gridY,
                    getDefaultElementWidth(d)
                );

                if (isSquaredTable(d) || isWall(d)) {
                    d.x += d.width - newWidth;
                    d.y += d.height - newHeight;
                }

                d.width = newWidth;
                d.height = newHeight;
            } else {
                d.width = Math.max(gridX - d.x, getDefaultElementWidth(d));
                d.height = Math.max(gridY - d.y, getDefaultElementWidth(d));
            }

            if (isTable(d)) {
                instance.renderTableElements();
            } else {
                instance.renderWallElements();
            }
        };
    }

    elementResizeStartEnd({
        type,
        sourceEvent,
    }: D3DragEvent<Element, unknown, unknown>) {
        const element = select(sourceEvent.target as Element);
        const radius = type === "start" ? 6 : 2;

        element.attr("r", radius);
    }

    resizerHover({ type, target }: MouseEvent) {
        const element = select(target as Element);
        const radius = type === "mouseenter" ? 6 : 2;

        element.attr("r", radius);
    }

    setupEditor() {
        if (!isEditorModeActive(this.mode)) return;

        this.floor
            .selectAll(".vertical")
            .data(range(1, this.width / RESOLUTION))
            .join("line")
            .attr("class", "vertical")
            .attr("x1", (d) => d * RESOLUTION)
            .attr("y1", 0)
            .attr("x2", (d) => d * RESOLUTION)
            .attr("y2", this.height);

        this.floor
            .selectAll(".horizontal")
            .data(range(1, this.height / RESOLUTION))
            .join("line")
            .attr("class", "horizontal")
            .attr("x1", 0)
            .attr("y1", (d) => d * RESOLUTION)
            .attr("x2", this.width)
            .attr("y2", (d) => d * RESOLUTION);
    }

    setSVGAttributes() {
        this.svg
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr(
                "class",
                `FloorEditor__SVG ${whiteSpaceToUnderscore(this.name)}`
            );
    }

    addClickListenerToSVGContainer() {
        this.svg.on("dblclick", (event: MouseEvent) => {
            event.preventDefault();
            this.dblClickHandler(this, pointer(event));
        });
    }

    render() {
        this.setSVGAttributes();
        this.addClickListenerToSVGContainer();
        this.setupEditor();
        this.renderWallElements();
        this.renderTableElements();
    }

    createBaseElements() {
        this.svg = select(this.container).append("svg");
        this.floor = this.svg.append("g");
    }

    addZoomBehaviourToSvgElement() {
        const zoomBehaviour = zoom()
            .scaleExtent([1 / 2, 2])
            .constrain((transform, extent, translateExtent) => {
                const cx = transform.invertX((extent[1][0] - extent[0][0]) / 2);
                const cy = transform.invertY((extent[1][1] - extent[0][1]) / 2);
                const dcx0 = Math.min(0, cx - translateExtent[0][0]);
                const dcx1 = Math.max(0, cx - translateExtent[1][0]);
                const dcy0 = Math.min(0, cy - translateExtent[0][1]);
                const dcy1 = Math.max(0, cy - translateExtent[1][1]);
                return transform.translate(
                    Math.min(0, dcx0) || Math.max(0, dcx1),
                    Math.min(0, dcy0) || Math.max(0, dcy1)
                );
            })
            .on("zoom", (e) => this.floor.attr("transform", e.transform));

        this.svg
            .call(zoomBehaviour as any)
            .on("wheel.zoom", null)
            .on("dblclick.zoom", null);
    }

    init() {
        this.createBaseElements();
        this.addZoomBehaviourToSvgElement();
        this.render();
    }
}
