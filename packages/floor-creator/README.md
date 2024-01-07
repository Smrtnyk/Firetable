# Interactive Floor Planner

## Introduction
The Interactive Floor Planner is a JavaScript library developed for creating and managing interactive floor plans in event management systems.
This library utilizes the power of Fabric.js and provides two main modules: `Floor Editor` for designing floor plans and `Floor Viewer` for displaying these plans interactively.
It is created for purpose of the Firetable project, but can be used in any other project as well, if there is a need, it can be published as a separate npm package.

## Features

### Floor Editor
- Create and edit dynamic floor plans with draggable and resizable elements.
- Supports various elements like tables, sofas, DJ booths, stages, spiral staircases, and more.
- Undo/Redo functionality for efficient floor plan editing.
- Grid overlay support for precise alignment and placement of elements.
- Customizable zoom and pan functionality for easy navigation across large floor plans.

### Floor Viewer
- Display floor plans in a non-editable format, ideal for presentations or viewing purposes.
- Pan and zoom capabilities for exploring detailed floor plans.
- Interactive elements with custom event handling.

### General Features
- Responsive design to fit various container sizes.
- Touch event support for mobile and touch-enabled devices.
- Extensible architecture to add custom floor elements.

## Using the Library

### Creating a Floor Editor Instance
```typescript
const editor = new FloorEditor({
  canvas: document.getElementById('canvas-element-id'),
  containerWidth: 800
});
```

#### Adding a Floor Element
```typescript
const elementOptions: CreateElementOptions = {
  label: 'Table 1',
  x: 100, // X-coordinate on the canvas
  y: 150, // Y-coordinate on the canvas
  tag: FloorElementTypes.RECT_TABLE
};

editor.addElement(elementOptions);
```

### Creating a Floor Viewer Instance
```typescript
const viewer = new FloorViewer({
  canvas: document.getElementById('canvas-element-id'),
  containerWidth: 800
});
```

### Event handling

#### Floor Editor
Floor editor emits following events:

```typescript
type FloorEditorEvents = {
    elementClicked: [FloorEditor, FloorEditorElement];
    doubleClick: [FloorEditor, NumberTuple];
    commandChange: [];
    rendered: [undefined];
    drop: [FloorEditor, FloorDropEvent];
};

editor.on('elementClicked', (editor, element) => {
  console.log('Element clicked:', element);
});
```

#### Floor Viewer
Floor viewer emits following events:

```typescript
type FloorViewerEvents = {
    elementClicked: [FloorViewer, FloorEditorElement];
};

viewer.on('elementClicked', (viewer, element) => {
    console.log('Element clicked:', element);
});
```
