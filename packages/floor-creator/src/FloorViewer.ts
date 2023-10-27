import { Floor } from "./Floor";
import { fabric } from "fabric";

export class FloorViewer extends Floor {
    protected setElementProperties(element: fabric.Object) {
        element.lockScalingX = true;
        element.lockScalingY = true;
        element.lockMovementX = true;
        element.lockMovementY = true;
        element.lockScalingFlip = true;
    }
}
