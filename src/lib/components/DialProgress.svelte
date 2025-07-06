<script lang="ts">
    // Default size constants
    const DEFAULT_SIZE = 64;
    const DEFAULT_STROKE_WIDTH = 8;
    const ARC_BG_COLOR = "#184c32";
    const ARC_FG_COLOR = "#4be06b";

    export let min: number = 0;
    export let max: number = 1;
    export let currentValue: number = 0;
    export let size: number = DEFAULT_SIZE;
    export let strokeWidth: number = DEFAULT_STROKE_WIDTH;
    export let color: string = ARC_FG_COLOR;

    // Clamp value between min and max
    function clamp(val: number, min: number, max: number) {
        return Math.max(min, Math.min(max, val));
    }

    $: progress = (clamp(currentValue, min, max) - min) / (max - min);

    $: radius = (size - strokeWidth) / 2;
    $: circumference = 2 * Math.PI * radius;
    $: arcLength = progress * circumference;
    $: dashArray = `${arcLength} ${circumference - arcLength}`;
    $: center = size / 2;
    $: ariaValue = clamp(currentValue, min, max);
</script>

<svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    style="display: block"
    aria-valuenow={ariaValue}
    aria-valuemin={min}
    aria-valuemax={max}
    role="progressbar"
>
    <!-- Background circle -->
    <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={ARC_BG_COLOR}
        stroke-width={strokeWidth}
        opacity="0.85"
    />
    <!-- Foreground arc (progress) -->
    <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={dashArray}
        stroke-dashoffset={circumference / 4}
        style="transition: stroke-dasharray 0.025s linear;"
        transform={`rotate(-90 ${center} ${center})`}
    />
</svg>

<style>
    :global(svg) {
        user-select: none;
        touch-action: none;
    }
</style>
