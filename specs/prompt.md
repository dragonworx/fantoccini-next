Create a specification for a declarative layout syntax which resembles JSON but is actually Javascript Object Literal notation suitable for runtime. Add the spec to the root `specs` folder of this repository.

The layout itself is represented by a special `LayoutNodeRoot` subclass object, which is a derivative from `LayoutNode`. This node represents an instance of a `Container`. The container can be passed or is created by the layout node.

`LayoutNode` has these properties:

- `tag?`:string - an arbitrary string
- `children`:Array<LayoutNode> - an array of child nodes
- any of the properties of `IGeometry`.
- any of the properties of `ILayout`

`LayoutNodeRoot` has these additional properties:
- `instance`: Container - the instance of the container created by this layout node. This means children and containers processed during `applyLayout` will be added to this instance. Otherwise an instance is created automatically by the layout node.

A top level module function `applyLayout` is provided which takes a `LayoutNodeRoot` (and optional `Container` instance) and traverses the object literal structure to apply the layout by creating containers, and passing element and layout info to layout managers to calculate bounding boxes. The function signature is:

```javascript
function applyLayout(layout: LayoutNode, ?Container: Container): Container {
  // traverse the layout node structure walking through each LayoutNode as a container with Element or Container children
  // travel bottom-up, meaning children are processed before their parent nodes
  // find leaf `Container` nodes and recursively apply layout properties to them from the bottom up to ensure all children are processed before their parent
  // return the Container instance created or passed in
}
```

The function will traverse the `LayoutNode` and apply the properties to the corresponding layout object child, creating or updating instance bounding boxes as necessary. The cascade is bottom-up, meaning that child `Container` nodes are processed before their parent nodes. This ensures that all child nodes are fully processed before their parent node is applied. Changes in the layout object model will trigger any necessary reflows or repaints in the UI. `Container` is responsible for layout, `Element` is responsible for rendering.