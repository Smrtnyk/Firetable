import { Floor } from "./Floor";
import { fabric } from "fabric";

export class FloorEditor extends Floor {
    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = false;
        element.lockScalingY = false;
        element.lockMovementX = false;
        element.lockMovementY = false;
        element.lockScalingFlip = true;
    }
}
