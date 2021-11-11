import { EnterElement, pointer, select, Selection } from "d3-selection";
import { range } from "d3-array";
import { RESOLUTION, SVG_NAMESPACE } from "./constants";
import {
    calculateBottomResizableCirclePositionX,
    calculateBottomResizableCirclePositionY,
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
import { BaseFloorElement, FloorMode, FloorDoc, TableElement } from "src/types/floor";
import { isRoundTable, isTable, isWall } from "src/floor-manager/type-guards";
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
import { drag } from "d3-drag";

export class Floor {
    name: string;
    width: number;
    height: number;
    data: BaseFloorElement[];

    public readonly id: string;
    private selectedElement: BaseFloorElement | null = null;

    private readonly mode: FloorMode;
    private readonly container: Element;
    private readonly dblClickHandler: FloorDoubleClickHandler;
    private readonly elementClickHandler: ElementClickHandler;

    private svg!: Selection<SVGSVGElement, unknown, null, unknown>;
    private floor!: Selection<SVGGElement, unknown, null, unknown>;

    private elementClickListener = (event: Event, d: BaseFloorElement) => {
        event.stopPropagation();
        this.setSelectedElement(event.currentTarget, d);
        this.elementClickHandler(this, d);
    };

    private constructor({
        floorDoc,
        container,
        mode,
        elementClickHandler,
        dblClickHandler,
    }: typeof Floor.Builder.prototype) {
        if (!floorDoc) {
            throw new Error("Floor document must be defined in order to instantiate a floor map!");
        }

        if (!container) {
            throw new Error("Container must be set!");
        }

        const { name, width, height, data, id } = floorDoc;

        this.id = id;
        this.mode = mode;
        this.data = data;
        this.name = name;
        this.width = width;
        this.height = height;
        this.container = container;

        // Handlers
        this.dblClickHandler = dblClickHandler;
        this.elementClickHandler = elementClickHandler;

        this.init();
    }

    public get tables(): TableElement[] {
        return getTables(this);
    }

    public get freeTables(): TableElement[] {
        return getFreeTables(this);
    }

    updateDimensions(newWidth: number, newHeight: number) {
        this.width = newWidth;
        this.height = newHeight;

        this.destroy();
        this.init();
    }

    public updateElementProperty<T extends BaseFloorElement, S extends keyof BaseFloorElement>(
        element: T,
        property: S,
        value: T[S]
    ): void {
        const elementInFloor = this.data.find((floorEl) => {
            return floorEl.id === element.id;
        });
        if (!elementInFloor) return;
        elementInFloor[property] = value;
        isTable(elementInFloor) ? this.renderTableElements() : this.renderWallElements();
    }

    public updateTableId(element: TableElement, value: TableElement["tableId"]): void {
        if (this.hasSameTableId(value)) {
            throw new Error("Table id already taken!");
        }
        const tableInFloor = this.tables.find((floorEl) => {
            return floorEl.id === element.id;
        });
        if (!tableInFloor) return;
        tableInFloor["tableId"] = value;
        this.renderTableElements();
    }

    private hasSameTableId(tableId: string): boolean {
        return !!this.tables.find((table) => table.tableId === tableId);
    }

    private destroy(): void {
        this.svg.remove();
        this.floor.remove();
    }

    public addWall([x, y]: NumberTuple) {
        this.data.push(makeRawWall(x, y));
        this.renderWallElements();
    }

    public removeElement(element: BaseFloorElement) {
        this.unsetSelectedElement();
        this.data = this.data.filter((d) => d.id !== element.id);
        isTable(element) ? this.renderTableElements() : this.renderWallElements();
    }

    public addTableElement(rawTableElement: tableElementInit) {
        this.data.push(
            makeRawTable({
                floor: this.name,
                ...rawTableElement,
            })
        );
        this.renderTableElements();
    }

    public changeName(newName: string) {
        this.name = newName;
        this.tables.forEach((table) => (table.floor = newName));
    }

    private onWallsEnter(enter: Selection<EnterElement, BaseFloorElement, SVGGElement, unknown>) {
        const wallG = enter
            .append("g")
            .attr("class", "wallGroup")
            .attr("transform", translateElementToItsPosition);

        wallG
            .append("rect")
            .attr("class", "wall")
            .attr("height", (d) => d.height)
            .attr("width", calculateWallWidth);

        wallG.on("click", this.elementClickListener);

        if (isEditorModeActive(this.mode)) {
            this.addDragBehaviourToElement(this, wallG);
        }
    }

    private onWallsUpdate(update: baseElementGroupSelection) {
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

    private renderWallElements() {
        const wallsData = this.data.filter(isWall);

        this.floor
            .selectAll("g.wallGroup")
            .data(wallsData)
            // @ts-ignore Whatever
            .join(this.onWallsEnter.bind(this), this.onWallsUpdate);
    }

    private unsetSelectedElement() {
        if (!isEditorModeActive(this.mode)) return;
        const selectedElement = document.querySelector(".selected");
        if (!selectedElement) {
            return;
        }
        selectedElement.classList.remove("selected");
        selectedElement.querySelector(".bottomright")?.remove();
        this.selectedElement = null;
        this.elementClickHandler(null, null);
    }

    private setSelectedElement(selectedElement: EventTarget | null, d: BaseFloorElement) {
        if (!isEditorModeActive(this.mode)) return;
        this.unsetSelectedElement();
        if (!(selectedElement instanceof Element)) {
            return;
        }
        selectedElement.classList.add("selected");
        this.selectedElement = d;
        this.elementResizeBehavior(selectedElement);
    }

    private onTablesEnter(enter: tableElementGroupSelection) {
        const tableG = enter
            .append("g")
            .attr("class", generateTableGroupClass)
            .attr("transform", translateElementToItsPosition);

        const tables = tableG.append((d) => document.createElementNS(SVG_NAMESPACE, d.tag));

        tables.each(this.eachTableDimensions);

        tableG
            .append("text")
            .attr("transform", getTableTextPosition)
            .attr("class", "table__id")
            .text(getTableText);

        tableG.select(":first-child").attr("class", generateTableClass);

        tableG.on("click", this.elementClickListener);

        this.addDragBehaviourToElement(this, tableG);
    }

    private onTablesUpdate(update: tableElementGroupSelection) {
        update.attr("transform", translateElementToItsPosition);
        update
            .select(".bottomright")
            .attr("cx", calculateBottomResizableCirclePositionX)
            .attr("cy", calculateBottomResizableCirclePositionY);
        update.select(".table").attr("class", generateTableClass);
        update.select("circle.table").attr("r", getRoundTableRadius);
        update.select("rect.table").attr("height", getTableHeight).attr("width", getTableWidth);
        update.select("text").attr("transform", getTableTextPosition).text(getTableText);
    }

    public renderTableElements() {
        this.floor
            .selectAll<SVGGElement, TableElement>("g.tableGroup")
            .data(this.tables, (d) => d.tableId)
            // @ts-ignore I have 0 fucking idea how to type d3 styff
            .join(this.onTablesEnter.bind(this), this.onTablesUpdate);
    }

    private eachTableDimensions(this: SVGElement, d: TableElement) {
        const element = select<SVGElement, TableElement>(this);
        isRoundTable(d)
            ? element.attr("r", getRoundTableRadius)
            : element.attr("height", getTableHeight).attr("width", getTableWidth);
    }

    private addDragBehaviourToElement(
        instance: Floor,
        element:
            | Selection<SVGGElement, BaseFloorElement, SVGGElement, unknown>
            | Selection<SVGGElement, TableElement, SVGGElement, unknown>
    ) {
        const dragBehaviour = drag<Element, BaseFloorElement, Element>()
            .on("start", instance.elementDragStarted)
            .on("drag", elementDragging)
            .on("end", instance.elementDragEnded);

        dragBehaviour(element as any);

        function elementDragging(this: Element, { x, y }: DragEvent, d: BaseFloorElement) {
            const matchesSelectedElement = this === document.querySelector(".selected");
            if (!matchesSelectedElement) return;
            const gridX = possibleXMove(instance.width, x, d.width);
            const gridY = possibleYMove(instance.height, y, d.height);

            d.x = gridX;
            d.y = gridY;

            select(this).attr("transform", `translate(${gridX},${gridY})`);
        }
    }

    private elementDragStarted(this: Element): void {
        select(this).classed("active", true);
    }

    private elementDragEnded(this: Element): void {
        select(this).classed("active", false);
    }

    private elementResizeBehavior(element: Element) {
        const node = this.floor?.node();
        if (!node) return;

        const circleG = select<Element, TableElement>(element);
        const dragBehaviour = drag<SVGGElement, BaseFloorElement, unknown>()
            .container(node)
            .subject(({ x, y }) => ({ x, y }))
            .on("drag", this.elementResizing(this));

        circleG
            .append("circle")
            .attr("class", "bottomright")
            .attr("r", 5)
            .attr("cx", calculateBottomResizableCirclePositionX)
            .attr("cy", calculateBottomResizableCirclePositionY)
            .on("mouseenter mouseleave", Floor.resizerHover)
            .call(dragBehaviour as any);
    }

    private elementResizing(instance: Floor) {
        return function (event: FTDragEvent, d: BaseFloorElement) {
            const { x, y } = event;
            const gridX = possibleXMove(instance.width + d.width, x, d.width);
            const gridY = possibleYMove(instance.height + d.height, y, d.height);
            d.width = Math.max(gridX - d.x, getDefaultElementWidth(d));
            d.height = Math.max(gridY - d.y, getDefaultElementWidth(d));

            if (isTable(d)) {
                instance.renderTableElements();
            } else {
                instance.renderWallElements();
            }
            // To trigger the reactivity if vue component registers the handler
            instance.elementClickHandler(instance, { ...d });
        };
    }

    private static resizerHover({ type, target }: MouseEvent) {
        const element = select(target as Element);
        const radius = type === "mouseenter" ? 6 : 5;

        element.attr("r", radius);
    }

    private setupEditor() {
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

    private setSVGAttributes() {
        this.svg
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("preserveAspectRatio", "xMidYMid")
            .attr("class", `FloorEditor__SVG ${whiteSpaceToUnderscore(this.name)} shadow-3`);
    }

    private addClickListenerToSVGContainer() {
        this.svg
            .on("dblclick", (event: MouseEvent) => {
                event.preventDefault();
                this.dblClickHandler(this, pointer(event));
            })
            .on("click", () => {
                this.unsetSelectedElement();
                this.elementClickHandler(null as unknown as Floor, null);
            });
    }

    private render() {
        this.setSVGAttributes();
        this.addClickListenerToSVGContainer();
        this.setupEditor();
        this.renderWallElements();
        this.renderTableElements();
    }

    private createBaseElements() {
        this.svg = select(this.container).append("svg");
        this.floor = this.svg.append("g");
    }

    private init() {
        this.createBaseElements();
        this.render();
    }

    static Builder = class {
        floorDoc: Readonly<FloorDoc> | undefined;
        container: Element | undefined;
        mode: FloorMode = FloorMode.LIVE;
        elementClickHandler: ElementClickHandler = NOOP;
        dblClickHandler: FloorDoubleClickHandler = NOOP;

        public setContainer(container: Element) {
            this.container = container;
            return this;
        }

        public setMode(mode: FloorMode) {
            this.mode = mode;
            return this;
        }

        public setFloorDocument(floorDoc: FloorDoc) {
            this.floorDoc = JSON.parse(JSON.stringify(floorDoc));
            return this;
        }

        public setElementClickHander(handler: ElementClickHandler) {
            this.elementClickHandler = handler;
            return this;
        }

        public setFloorDoubleClickHandler(handler: FloorDoubleClickHandler) {
            this.dblClickHandler = handler;
            return this;
        }

        public build() {
            if (!this.container) {
                throw new Error("Container is no defined!");
            }

            if (!this.floorDoc) {
                throw new Error("Floor document is not defined!");
            }

            return new Floor(this);
        }
    };
}
