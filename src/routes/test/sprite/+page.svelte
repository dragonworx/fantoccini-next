<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { Sprite, type FillStyle } from "$lib/core/sprite";

    // Sprite management
    let sprites: Sprite[] = [];
    let selectedSprite: Sprite | null = null;
    let spriteContainer: HTMLDivElement;
    let spriteIdCounter = 0;

    // Add unique ID to sprites for tracking
    interface ExtendedSprite extends Sprite {
        id?: number;
        parent?: ExtendedSprite;
        children?: ExtendedSprite[];
        selected?: boolean;
    }

    // Property definitions for extensible UI generation
    interface PropertyConfig {
        key: keyof Sprite;
        label: string;
        type: "number" | "select" | "text" | "range" | "fillstyle";
        min?: number;
        max?: number;
        step?: number;
        options?: { value: any; label: string }[];
        defaultValue: any;
    }

    const spriteProperties: PropertyConfig[] = [
        // Position & Dimensions
        { key: "x", label: "X Position", type: "range", min: -200, max: 400, step: 1, defaultValue: 150 },
        { key: "y", label: "Y Position", type: "range", min: -200, max: 400, step: 1, defaultValue: 150 },
        { key: "z", label: "Z Position", type: "range", min: -100, max: 100, step: 1, defaultValue: 0 },
        { key: "width", label: "Width", type: "range", min: 10, max: 300, step: 1, defaultValue: 100 },
        { key: "height", label: "Height", type: "range", min: 10, max: 300, step: 1, defaultValue: 100 },

        // Transform Origin
        { 
            key: "originX", 
            label: "Origin X", 
            type: "select", 
            options: [
                { value: "0%", label: "Left (0%)" },
                { value: "50%", label: "Center (50%)" },
                { value: "100%", label: "Right (100%)" },
                { value: 0, label: "0px" },
                { value: 50, label: "50px" }
            ],
            defaultValue: "50%"
        },
        { 
            key: "originY", 
            label: "Origin Y", 
            type: "select", 
            options: [
                { value: "0%", label: "Top (0%)" },
                { value: "50%", label: "Center (50%)" },
                { value: "100%", label: "Bottom (100%)" },
                { value: 0, label: "0px" },
                { value: 50, label: "50px" }
            ],
            defaultValue: "50%"
        },

        // Rotation
        { key: "rotation", label: "Rotation", type: "range", min: -180, max: 180, step: 1, defaultValue: 0 },
        { key: "rotationX", label: "Rotation X", type: "range", min: -180, max: 180, step: 1, defaultValue: 0 },
        { key: "rotationY", label: "Rotation Y", type: "range", min: -180, max: 180, step: 1, defaultValue: 0 },
        { key: "rotationZ", label: "Rotation Z", type: "range", min: -180, max: 180, step: 1, defaultValue: 0 },

        // Scale
        { key: "scaleX", label: "Scale X", type: "range", min: 0.1, max: 3, step: 0.1, defaultValue: 1 },
        { key: "scaleY", label: "Scale Y", type: "range", min: 0.1, max: 3, step: 0.1, defaultValue: 1 },

        // Skew
        { key: "skewX", label: "Skew X", type: "range", min: -45, max: 45, step: 1, defaultValue: 0 },
        { key: "skewY", label: "Skew Y", type: "range", min: -45, max: 45, step: 1, defaultValue: 0 },

        // Border
        { key: "border", label: "Border", type: "text", defaultValue: "2px solid #4f8cff" }
    ];

    // Reactive properties object
    let properties: Record<string, any> = {};

    // Fill style controls
    let fillType: "color" | "gradient" | "image" = "color";
    let fillColor = "#4f8cff";
    let fillGradient = "linear-gradient(45deg, #4f8cff, #1ed760)";
    let fillImage = "https://picsum.photos/200/200";

    // Initialize properties with defaults
    function initializeProperties() {
        properties = {};
        spriteProperties.forEach(prop => {
            properties[prop.key] = prop.defaultValue;
        });
    }

    // Reactive fill style
    $: fillStyle = (() => {
        switch (fillType) {
            case "color":
                return { type: "color" as const, value: fillColor };
            case "gradient":
                return { type: "gradient" as const, value: fillGradient };
            case "image":
                return { type: "image" as const, value: fillImage };
            default:
                return { type: "color" as const, value: "#4f8cff" };
        }
    })();

    // Update selected sprite when properties change
    $: if (selectedSprite && browser) {
        // Update all numeric/string properties
        spriteProperties.forEach(prop => {
            if (properties[prop.key] !== undefined) {
                (selectedSprite as any)[prop.key] = properties[prop.key];
            }
        });
        
        // Update fill style
        selectedSprite.fill = fillStyle;
        
        // Update the visual representation
        selectedSprite.updateStyle();
    }

    // Animation controls
    let isAnimating = false;
    let animationFrame: number | null = null;

    function startAnimation() {
        if (!selectedSprite || isAnimating) return;
        isAnimating = true;
        
        const startTime = performance.now();
        
        function animate(currentTime: number) {
            if (!selectedSprite || !isAnimating) return;
            
            const elapsed = currentTime - startTime;
            const progress = (elapsed / 3000) % 1; // 3 second cycle
            
            // Animate rotation
            selectedSprite.rotation = progress * 360;
            
            // Animate position in a circle
            const centerX = properties.x || 150;
            const centerY = properties.y || 150;
            const radius = 50;
            selectedSprite.x = centerX + Math.cos(progress * Math.PI * 2) * radius;
            selectedSprite.y = centerY + Math.sin(progress * Math.PI * 2) * radius;
            
            // Animate scale
            selectedSprite.scaleX = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
            selectedSprite.scaleY = 1 + Math.cos(progress * Math.PI * 4) * 0.3;
            
            selectedSprite.updateStyle();
            animationFrame = requestAnimationFrame(animate);
        }
        
        animationFrame = requestAnimationFrame(animate);
    }

    function stopAnimation() {
        isAnimating = false;
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        // Reset to current property values
        if (selectedSprite) {
            spriteProperties.forEach(prop => {
                if (properties[prop.key] !== undefined) {
                    (selectedSprite as any)[prop.key] = properties[prop.key];
                }
            });
            selectedSprite.fill = fillStyle;
            selectedSprite.updateStyle();
        }
    }

    function toggleAnimation() {
        if (isAnimating) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }

    function resetProperties() {
        stopAnimation();
        if (selectedSprite) {
            loadPropertiesFromSprite(selectedSprite);
        } else {
            initializeProperties();
            fillType = "color";
            fillColor = "#4f8cff";
            fillGradient = "linear-gradient(45deg, #4f8cff, #1ed760)";
            fillImage = "https://picsum.photos/200/200";
        }
    }

    // Sprite management functions
    function createSprite(parentSprite?: ExtendedSprite): ExtendedSprite {
        const newSprite = new Sprite({
            x: 10,
            y: 10,
            z: 0,
            width: 100,
            height: 100,
            fill: { type: "color", value: "#4f8cff" }
        }) as ExtendedSprite;

        newSprite.id = ++spriteIdCounter;
        newSprite.children = [];
        newSprite.selected = false;
        
        // Add selection styling
        newSprite.el.style.cursor = "pointer";
        newSprite.el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSprite(newSprite);
        });

        if (parentSprite) {
            newSprite.parent = parentSprite;
            parentSprite.children?.push(newSprite);
            newSprite.appendTo(parentSprite.el);
        } else {
            newSprite.appendTo(spriteContainer);
        }

        sprites.push(newSprite);
        newSprite.updateStyle();
        return newSprite;
    }

    function selectSprite(sprite: ExtendedSprite) {
        // Deselect current sprite
        if (selectedSprite) {
            selectedSprite.selected = false;
            updateSpriteSelection(selectedSprite);
        }

        // Select new sprite
        selectedSprite = sprite;
        selectedSprite.selected = true;
        updateSpriteSelection(selectedSprite);
        
        // Load sprite properties into controls
        loadPropertiesFromSprite(selectedSprite);
    }

    function updateSpriteSelection(sprite: ExtendedSprite) {
        if (sprite.selected) {
            sprite.el.style.outline = "3px solid #1ed760";
            sprite.el.style.outlineOffset = "2px";
        } else {
            sprite.el.style.outline = "";
            sprite.el.style.outlineOffset = "";
        }
    }

    function loadPropertiesFromSprite(sprite: ExtendedSprite) {
        spriteProperties.forEach(prop => {
            properties[prop.key] = (sprite as any)[prop.key];
        });
        
        // Load fill style
        if (sprite.fill.type === "color") {
            fillType = "color";
            fillColor = sprite.fill.value;
        } else if (sprite.fill.type === "gradient") {
            fillType = "gradient";
            fillGradient = sprite.fill.value;
        } else if (sprite.fill.type === "image") {
            fillType = "image";
            fillImage = sprite.fill.value;
        }
    }

    function addChildSprite() {
        if (!selectedSprite) return;
        const newSprite = createSprite(selectedSprite);
        selectSprite(newSprite);
    }

    function deleteSprite() {
        if (!selectedSprite || sprites.length <= 1) return;
        
        // Remove from parent's children array
        if (selectedSprite.parent) {
            const parentChildren = selectedSprite.parent.children || [];
            const index = parentChildren.indexOf(selectedSprite);
            if (index > -1) {
                parentChildren.splice(index, 1);
            }
        }

        // Remove from sprites array
        const index = sprites.indexOf(selectedSprite);
        if (index > -1) {
            sprites.splice(index, 1);
        }

        // Remove from DOM
        selectedSprite.remove();

        // Select the first remaining sprite
        if (sprites.length > 0) {
            selectSprite(sprites[0]);
        } else {
            selectedSprite = null;
            initializeProperties();
        }
    }

    onMount(() => {
        if (!browser) return;
        
        initializeProperties();
        
        // Create initial sprite
        const initialSprite = createSprite();
        selectSprite(initialSprite);
    });

    onDestroy(() => {
        stopAnimation();
        sprites.forEach(sprite => sprite.remove());
        sprites = [];
        selectedSprite = null;
    });
</script>

<div class="page-center dark">
    <h1>Sprite Demo</h1>

    <div class="demo-layout">
        <!-- Controls Section -->
        <div class="controls-panel">
            <div class="controls-grid">
                <!-- Property Controls -->
                {#each spriteProperties as prop}
                    <div class="control-group">
                        <label for={prop.key}>{prop.label}</label>
                        
                        {#if prop.type === "range"}
                            <div class="range-container">
                                <input
                                    id={prop.key}
                                    type="range"
                                    min={prop.min}
                                    max={prop.max}
                                    step={prop.step}
                                    bind:value={properties[prop.key]}
                                />
                                <span class="range-value">{properties[prop.key]}</span>
                            </div>
                        {:else if prop.type === "select"}
                            <select id={prop.key} bind:value={properties[prop.key]}>
                                {#each prop.options || [] as option}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        {:else if prop.type === "text"}
                            <input
                                id={prop.key}
                                type="text"
                                bind:value={properties[prop.key]}
                            />
                        {/if}
                    </div>
                {/each}

                <!-- Fill Style Controls -->
                <div class="control-group fill-controls">
                    <label>Fill Style</label>
                    <div class="fill-type-selector">
                        <label class="radio-label">
                            <input type="radio" bind:group={fillType} value="color" />
                            Color
                        </label>
                        <label class="radio-label">
                            <input type="radio" bind:group={fillType} value="gradient" />
                            Gradient
                        </label>
                        <label class="radio-label">
                            <input type="radio" bind:group={fillType} value="image" />
                            Image
                        </label>
                    </div>
                    
                    {#if fillType === "color"}
                        <input type="color" bind:value={fillColor} />
                    {:else if fillType === "gradient"}
                        <input type="text" bind:value={fillGradient} placeholder="CSS gradient" />
                    {:else if fillType === "image"}
                        <input type="text" bind:value={fillImage} placeholder="Image URL" />
                    {/if}
                </div>

                <!-- Sprite Management -->
                <div class="button-row">
                    <h4>Sprite Management</h4>
                    <div class="button-group">
                        <button 
                            class="main-btn" 
                            on:click={addChildSprite}
                            disabled={!selectedSprite}
                        >
                            Add Child
                        </button>
                        <button 
                            class="danger-btn" 
                            on:click={deleteSprite}
                            disabled={!selectedSprite || sprites.length <= 1}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="button-row">
                    <h4>Animation & Controls</h4>
                    <div class="button-group">
                        <button class="main-btn" on:click={toggleAnimation}>
                            {isAnimating ? "Stop Animation" : "Start Animation"}
                        </button>
                        <button class="secondary-btn" on:click={resetProperties}>
                            Reset Properties
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sprite Display Area -->
        <div class="sprite-display">
            <div class="sprite-container" bind:this={spriteContainer}>
                <!-- Sprite will be rendered here -->
            </div>
            
            <!-- Property Display -->
            <div class="property-display">
                <h3>
                    {#if selectedSprite}
                        Selected Sprite #{selectedSprite.id}
                        {#if selectedSprite.parent}
                            (Child of #{selectedSprite.parent.id})
                        {/if}
                    {:else}
                        No Sprite Selected
                    {/if}
                </h3>
                
                {#if selectedSprite}
                    <div class="sprite-info">
                        <div class="property-item">
                            <span class="property-name">Total Sprites:</span>
                            <span class="property-value">{sprites.length}</span>
                        </div>
                        <div class="property-item">
                            <span class="property-name">Children:</span>
                            <span class="property-value">{selectedSprite.children?.length || 0}</span>
                        </div>
                    </div>
                    
                    <div class="property-grid">
                        {#each spriteProperties as prop}
                            <div class="property-item">
                                <span class="property-name">{prop.label}:</span>
                                <span class="property-value">{properties[prop.key]}</span>
                            </div>
                        {/each}
                        <div class="property-item">
                            <span class="property-name">Fill:</span>
                            <span class="property-value">{fillType} - {fillStyle.value}</span>
                        </div>
                    </div>

                    <!-- Sprite Hierarchy -->
                    {#if sprites.length > 1}
                        <div class="sprite-hierarchy">
                            <h4>Sprite Hierarchy</h4>
                            <div class="hierarchy-list">
                                {#each sprites.filter(s => !s.parent) as rootSprite}
                                    <div class="hierarchy-item" class:selected={rootSprite === selectedSprite}>
                                        <button 
                                            class="sprite-selector"
                                            on:click={() => selectSprite(rootSprite)}
                                        >
                                            Sprite #{rootSprite.id}
                                        </button>
                                        {#if rootSprite.children && rootSprite.children.length > 0}
                                            <div class="children">
                                                {#each rootSprite.children as childSprite}
                                                    <div class="hierarchy-item child" class:selected={childSprite === selectedSprite}>
                                                        <button 
                                                            class="sprite-selector"
                                                            on:click={() => selectSprite(childSprite)}
                                                        >
                                                            └ Sprite #{childSprite.id}
                                                        </button>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                {:else}
                    <p>Click on a sprite to select it and view its properties.</p>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    :root {
        --primary-blue: #4f8cff;
        --primary-green: #1ed760;
        --dark-bg: #23283a;
        --darker-bg: #181c24;
        --text-light: #e3e9f3;
        --text-muted: #8ca0b3;
        --border-color: #3a4660;
    }

    .dark {
        color: var(--text-light);
    }

    .page-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100vw;
        min-height: 100vh;
        box-sizing: border-box;
        padding: 2rem 1rem;
    }

    .demo-layout {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: 2rem;
        width: 100%;
        max-width: 1400px;
        height: 80vh;
    }

    .controls-panel {
        background: var(--dark-bg);
        border-radius: 18px;
        padding: 1.5rem;
        overflow-y: auto;
        box-shadow: 0 2px 24px rgba(0, 0, 0, 0.5);
    }

    .controls-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .control-group label {
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--text-light);
        margin-bottom: 0.25rem;
    }

    .range-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .range-container input[type="range"] {
        flex: 1;
        height: 6px;
        background: var(--border-color);
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
    }

    .range-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: var(--primary-blue);
        border-radius: 50%;
        cursor: pointer;
    }

    .range-value {
        min-width: 3rem;
        text-align: right;
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    input[type="text"],
    input[type="color"],
    select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--darker-bg);
        color: var(--text-light);
        font-size: 0.9rem;
    }

    input[type="text"]:focus,
    select:focus {
        outline: none;
        border-color: var(--primary-blue);
    }

    .fill-controls {
        border-top: 1px solid var(--border-color);
        padding-top: 1rem;
        margin-top: 1rem;
    }

    .fill-type-selector {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.85rem;
        cursor: pointer;
    }

    .button-row {
        border-top: 1px solid var(--border-color);
        padding-top: 1rem;
        margin-top: 1rem;
    }

    .button-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .button-row h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-light);
        font-size: 0.9rem;
        font-weight: 600;
    }

    .main-btn {
        background: linear-gradient(90deg, var(--primary-blue) 60%, #1a5fd0 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: opacity 0.2s;
    }

    .main-btn:hover {
        opacity: 0.9;
    }

    .secondary-btn {
        background: var(--border-color);
        color: var(--text-light);
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .secondary-btn:hover {
        background: #4a5570;
    }

    .danger-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .danger-btn:hover {
        background: #c82333;
    }

    .danger-btn:disabled,
    .main-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .danger-btn:disabled:hover,
    .main-btn:disabled:hover {
        background: #dc3545;
        opacity: 0.5;
    }

    .main-btn:disabled:hover {
        background: linear-gradient(90deg, var(--primary-blue) 60%, #1a5fd0 100%);
        opacity: 0.5;
    }

    .sprite-display {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .sprite-container {
        position: relative;
        flex: 1;
        background: var(--darker-bg);
        border: 2px solid var(--border-color);
        border-radius: 12px;
        overflow: hidden;
        min-height: 400px;
    }

    .property-display {
        background: var(--dark-bg);
        border-radius: 12px;
        padding: 1rem;
        max-height: 300px;
        overflow-y: auto;
    }

    .property-display h3 {
        margin: 0 0 1rem 0;
        color: var(--text-light);
        font-size: 1.1rem;
    }

    .property-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.5rem;
    }

    .property-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
        border-bottom: 1px solid var(--border-color);
    }

    .property-name {
        font-size: 0.85rem;
        color: var(--text-muted);
    }

    .property-value {
        font-family: monospace;
        font-size: 0.85rem;
        color: var(--text-light);
        text-align: right;
    }

    .sprite-info {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .sprite-hierarchy {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    .sprite-hierarchy h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-light);
        font-size: 0.9rem;
        font-weight: 600;
    }

    .hierarchy-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .hierarchy-item {
        display: flex;
        flex-direction: column;
    }

    .hierarchy-item.child {
        margin-left: 1rem;
    }

    .sprite-selector {
        background: var(--darker-bg);
        color: var(--text-light);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        text-align: left;
        font-size: 0.8rem;
        transition: all 0.2s;
    }

    .sprite-selector:hover {
        background: var(--border-color);
        border-color: var(--primary-blue);
    }

    .hierarchy-item.selected .sprite-selector {
        background: var(--primary-blue);
        border-color: var(--primary-blue);
        color: white;
    }

    .children {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-top: 0.25rem;
    }

    @media (max-width: 1000px) {
        .demo-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
            height: auto;
        }

        .controls-panel {
            max-height: 400px;
        }

        .sprite-container {
            min-height: 300px;
        }
    }
</style>