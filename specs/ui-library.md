# UI Library Specification

## Introduction

A high performance and optimised graphics library tailored for flat 2d user interfaces. The library uses threejs for rendering and provides a set of components for building user interfaces.

## Features

The library has the following features:

- High performance rendering
- Optimised for flat 2d user interfaces
- Uses threejs for rendering
- Provides a set of components for building user interfaces
- Easy to use and learn
- Supports custom themes and styles
- Supports internationalization and localization
- Supports accessibility features
- Supports responsive design
- Supports dark mode
- Supports light mode
- Provides fast object picking
- Provides full event support for mouse and keyboard
- Manages a state machine per element for user interactions

## Architecture

The library is built using a modular architecture that allows for easy extension and customization. The library is composed of the following modules:

- Rendering module: responsible for rendering the user interface using threejs
- Component module: responsible for building user interfaces using components
- State module: responsible for managing the state of the user interface
- Event module: responsible for handling events from the user interface
- Theme module: responsible for managing the theme and styles of the user interface
- Localization module: responsible for managing the localization and internationalization of the user interface
- Accessibility module: responsible for managing the accessibility features of the user interface
- Responsive module: responsible for managing the responsive design of the user interface
- Dark mode module: responsible for managing the dark mode of the user interface
- Light mode module: responsible for managing the light mode of the user interface
- Object picking module: responsible for managing the object picking of the user interface
- Event support module: responsible for managing the event support for mouse and keyboard
- State machine module: responsible for managing the state machine per element for user interactions

### Elements

The `Element` is the composable building blocks of the user interface. It is responsible for managing the state, appearance, and behavior of the user interface. The element has geometry, appearance, and layout. Elements can be nested.

### Core Geometry

Each element has core geometry properties which contribute to a bounding box, relative to it's parent. The system is geared towards performance and simplicity. Rotation and scale are not provided, but in theory could be simulated with scalar calculations in some layout manager. The element defines these core geometric properties:

- `left`
- `top`
- `width`
- `height`

### Appearance

Each element has an appearance property which holds the values for the available appearance system options. The appearance system options are:

- `alpha` - A value between 0 and 1 representing the opacity of the element.
- `backgroundColor` - A color value in hexadecimal format.
- `borderColor` - A color value in hexadecimal format.
- `borderWidth` - A value representing the width of the element's border.
- `borderRadius` - A value representing the radius of the element's border.

### Containers

`Container` is a subclass of `Element` that can contain other elements. Elements cannot contain nested children by default, however containers override and extend this behavior. They are responsible for managing the layout of their elements, which means setting the Threejs properties of the corresponding threejs object. This enforces the user of the ui library to solve layout when adding children to a visual ui. Contains should provide a default layout manager.

Containers have instances of `LayoutManager` objects and a `calcLayout` method which calculates the layout of the container and its children. The children are passed to the layout managers `calcLayout` method which can use the layout properties of the element to calculate the elements bounding box coordinates.

### Layout

Layout should be called on the root of a `View` or any of it's children. From that point the layout algorithm would be:

-

Each element has a `layout` property which holds the layout system options. Layout managers can use these values to position elements correctly, and can interpret them as needed. The layout system options are:

- `paddingLeft` - A value representing the left padding of the element.
- `paddingRight` - A value representing the right padding of the element.
- `paddingTop` - A value representing the top padding of the element.
- `paddingBottom` - A value representing the bottom padding of the element.
- `marginLeft` - A value representing the left margin of the element.
- `marginRight` - A value representing the right margin of the element.
- `marginTop` - A value representing the top margin of the element.
- `marginBottom` - A value representing the bottom margin of the element.
- `hAlign` - A value representing the horizontal alignment of the element.
- `vAlign` - A value representing the vertical alignment of the element.

The same layout settings are available to different layout managers.

Layout needs to be calculated before a view could be seen, this should be done when the view first shows a new root, and any time the root or any children call `calcLayout()`.

#### Layout managers

A `LayoutManager` instance is responsible for calculating the layout of elements added to it. They are responsible for setting the bounding box coordinates of elements they manage. Layout managers inherit from `LayoutManager` to provide common functionality. Calculations are done as required by any caller of the `Container:calcLayout()` method, and not polled or using any timer. This is a push-based system, meaning that layout managers are responsible for triggering layout calculations when their elements change.

Layout managers can have their own custom properties and methods to manage their specific layout behavior. For example, a `GridLayout` might have properties for the number of columns and rows, while a `StackLayout` might have properties for the spacing between elements.

Once layout is calculated, the `Container` updates it's bounding box coordinates. This enables the container to act like an element that can be positioned and sized within a layout, creating nested layouts of layouts and elements.

There will be several layout managers available, but for MVP we will use the following only:

- `Absolute`: position the element based on it's local to global bounding coordinates

## Text

`Text` is a subclass of `Element` that provides text rendering functionality. It supports various text properties such as:

- `textColor` - A color value in hexadecimal format.
- `textSize` - A value representing the size of the element's text.
- `textStyle` - A value representing the style of the element's text.
- `textFont` - A value representing the font of the element's text.
- `textAlignment` - A value representing the alignment of the element's text.
- `textPadding` - A value representing the padding of the element's text.

Changing appearance properties will not change bounding box coordinates. Text will be wrapped to fit within the element's current bounding box.

Text should be handled by the Troika-three-text library. Changes to font details should clean up any existing resources.

Text features required:

- Text wrapping
- Text alignment
- Text padding
- Text selection
- Text editing

## Views

`View` is the top level object which manages a root `Container`, and a `HTMLCanvas` element (either given or created). Views have the following properties:

- `viewport`: The viewport element that the view is rendered to.
- `camera`: The camera used to render the view (orthographic by default, but can be changed to perspective).
- `scene`: The scene used to render the view (instance of THREE.Scene)
- `renderer`: The renderer used to render the view. (instance of THREE.WebGLRenderer)

Views have the following methods:

- `constructor`(rootElement): Initializes the view with the given root element.
- `setRoot`(rootElement): Sets the root element of the view.
- `render`(): Renders the view to the viewport.
- `resize`(width, height): Resizes the view to the given width and height.
- `calcLayout()`: Calculate the layout from the root `Container`
- `dispose`(): Disposes of the view.

## Events

Events use the existing capabilities in [event-emitter](src/core/event-emitter.ts).
