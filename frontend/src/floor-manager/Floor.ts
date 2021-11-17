import { EnterElement, pointer, select, Selection } from "d3-selection";
import { range } from "d3-array";
import { INITIAL_WALL_HEIGHT, RESOLUTION, SVG_NAMESPACE } from "./constants";
import {
    calculateBottomResizableCirclePositionX,
    calculateBottomResizableCirclePositionY,
    calculateWallWidth,
    generateTableClass,
    generateTableGroupClass,
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
import { willCollide } from "src/floor-manager/collision-detection";
import { addDragBehaviourToElement } from "src/floor-manager/element-drag";
import { elementResizeBehavior } from "src/floor-manager/element-resize";

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
    public readonly elementClickHandler: ElementClickHandler;

    private svg!: Selection<SVGSVGElement, unknown, null, unknown>;
    public floor!: Selection<SVGGElement, unknown, null, unknown>;

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
        this.data.push(
            makeRawWall(
                possibleXMove(this.width, x, calculateWallWidth()),
                possibleYMove(this.height, y, INITIAL_WALL_HEIGHT)
            )
        );
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
                x: possibleXMove(this.width, rawTableElement.x),
                y: possibleYMove(this.height, rawTableElement.y),
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
            addDragBehaviourToElement(this, wallG);
        }
    }

    private onWallsUpdate(update: baseElementGroupSelection) {
        update.attr("transform", translateElementToItsPosition);
        update
            .select("rect.wall")
            .attr("height", (d) => d.height)
            .attr("width", calculateWallWidth);
        update
            .select(".bottom-right")
            .attr("cx", (d) => d.width)
            .attr("cy", (d) => d.height);
    }

    public renderWallElements() {
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
        selectedElement.querySelector(".bottom-right")?.remove();
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
        elementResizeBehavior(this, selectedElement);
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
            .style("text-anchor", "middle")
            .attr("class", "table__id")
            .attr("dominant-baseline", "middle")
            .text(getTableText);

        tableG.select(":first-child").attr("class", generateTableClass);

        tableG.on("click", this.elementClickListener);

        addDragBehaviourToElement(this, tableG);
    }

    private onTablesUpdate(update: tableElementGroupSelection) {
        update.attr("transform", translateElementToItsPosition);
        update
            .select(".bottom-right")
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
            // @ts-ignore I have 0 fucking idea how to type d3 stuff
            .join(this.onTablesEnter.bind(this), this.onTablesUpdate);
    }

    private eachTableDimensions(this: SVGElement, d: TableElement) {
        const element = select<SVGElement, TableElement>(this);
        isRoundTable(d)
            ? element.attr("r", getRoundTableRadius)
            : element.attr("height", getTableHeight).attr("width", getTableWidth);
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
