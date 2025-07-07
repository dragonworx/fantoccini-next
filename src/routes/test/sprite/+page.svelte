<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { Sprite, type FillStyle } from "$lib/core/sprite";

    // Sprite instance
    let sprite: Sprite | null = null;
    let spriteContainer: HTMLDivElement;

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

    // Update sprite when properties change
    $: if (sprite && browser) {
        // Update all numeric/string properties
        spriteProperties.forEach(prop => {
            if (properties[prop.key] !== undefined) {
                (sprite as any)[prop.key] = properties[prop.key];
            }
        });
        
        // Update fill style
        sprite.fill = fillStyle;
        
        // Update the visual representation
        sprite.updateStyle();
    }

    // Animation controls
    let isAnimating = false;
    let animationFrame: number | null = null;

    function startAnimation() {
        if (!sprite || isAnimating) return;
        isAnimating = true;
        
        const startTime = performance.now();
        
        function animate(currentTime: number) {
            if (!sprite || !isAnimating) return;
            
            const elapsed = currentTime - startTime;
            const progress = (elapsed / 3000) % 1; // 3 second cycle
            
            // Animate rotation
            sprite.rotation = progress * 360;
            
            // Animate position in a circle
            const centerX = properties.x || 150;
            const centerY = properties.y || 150;
            const radius = 50;
            sprite.x = centerX + Math.cos(progress * Math.PI * 2) * radius;
            sprite.y = centerY + Math.sin(progress * Math.PI * 2) * radius;
            
            // Animate scale
            sprite.scaleX = 1 + Math.sin(progress * Math.PI * 4) * 0.3;
            sprite.scaleY = 1 + Math.cos(progress * Math.PI * 4) * 0.3;
            
            sprite.updateStyle();
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
        if (sprite) {
            spriteProperties.forEach(prop => {
                if (properties[prop.key] !== undefined) {
                    (sprite as any)[prop.key] = properties[prop.key];
                }
            });
            sprite.fill = fillStyle;
            sprite.updateStyle();
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
        initializeProperties();
        fillType = "color";
        fillColor = "#4f8cff";
        fillGradient = "linear-gradient(45deg, #4f8cff, #1ed760)";
        fillImage = "https://picsum.photos/200/200";
    }

    onMount(() => {
        if (!browser) return;
        
        initializeProperties();
        
        // Create sprite
        sprite = new Sprite({
            x: properties.x,
            y: properties.y,
            z: properties.z,
            width: properties.width,
            height: properties.height,
            fill: fillStyle
        });
        
        // Append to container
        if (spriteContainer) {
            sprite.appendTo(spriteContainer);
            sprite.updateStyle();
        }
    });

    onDestroy(() => {
        stopAnimation();
        if (sprite) {
            sprite.remove();
        }
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

                <!-- Action Buttons -->
                <div class="button-row">
                    <div class="button-group">
                        <button class="main-btn" on:click={toggleAnimation}>
                            {isAnimating ? "Stop Animation" : "Start Animation"}
                        </button>
                        <button class="secondary-btn" on:click={resetProperties}>
                            Reset All
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
                <h3>Current Properties</h3>
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