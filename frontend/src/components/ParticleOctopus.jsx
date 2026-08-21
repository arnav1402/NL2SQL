import { useEffect, useRef } from "react";
import "./ParticleOctopus.css";

const baseGrid = [
    ["tr","tr","tr","tr","tr","tr","tr","tr","tr","tr","b1","b1","b1","b1","b1","b1","tr","tr","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","eye","eye","b2","b2","eye","eye","b2","b2","b1","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","eye","b2","b2","b2","eye","b2","b2","b2","b1","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","eye","eye","b2","b2","eye","eye","b2","b2","b1","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","b1","b1","tr","tr","tr","b1","b2","b2","b2","b2","b2","b2","b2","b2","b1","tr","tr","tr","b1","tr"],
    ["tr","tr","b1","b2","b2","b1","tr","b2","b2","b2","b2","b2","b2","b2","b2","b2","b2","b2","b2","tr","b1","b2","b1"],
    ["tr","tr","b1","b2","b1","b2","b2","b2","b1","b2","b1","b2","b2","b1","b2","b1","b2","b1","b2","b2","b2","b1","b1"],
    ["tr","tr","tr","tr","tr","b1","b1","b1","b2","b2","b1","b2","b1","b1","b2","b1","b2","b2","b1","b1","b1","tr","tr"],
    ["tr","tr","tr","tr","b1","tr","tr","b2","b2","b1","tr","b2","b1","b1","b2","tr","b1","b2","b2","tr","tr","b1","tr"],
    ["tr","tr","tr","tr","b1","b2","b2","b2","b1","tr","tr","b2","b1","b1","b2","tr","tr","b1","b2","b2","b2","b1","tr"],
    ["tr","tr","tr","tr","tr","b1","b1","b1","tr","tr","b2","b2","tr","b1","b2","b2","tr","tr","b1","b1","b1","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","tr","tr","b2","b2","b1","tr","tr","b1","b2","tr","tr","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","b1","b2","b2","b1","tr","tr","tr","b1","b2","b2","b1","tr","tr","tr","tr","tr"],
    ["tr","tr","tr","tr","tr","tr","tr","b1","b1","tr","tr","tr","tr","tr","b1","b1","tr","tr","tr","tr","tr","tr"]
];

const BANDS = [
{ rows: [11, 12], amplitude: 0.7, phase: 0.0 },
{ rows: [13, 14, 15], amplitude: 1.1, phase: 0.3 },
{ rows: [16, 17, 18], amplitude: 1.5, phase: 0.6 },
{ rows: [19, 20], amplitude: 1.8, phase: 0.9 }
];

const MAX_STEP = 1;
const FRAME_COUNT = 8;
const FRAME_MS = 220;

function shiftedRow(row, offset) {
const out = new Array(row.length).fill("tr");

for (let i = 0; i < row.length; i++) {
    const src = i - offset;
    if (src >= 0 && src < row.length) {
    out[i] = row[src];
    }
}

return out;
}

function clampOffset(offset, previous) {
return Math.max(previous - MAX_STEP, Math.min(previous + MAX_STEP, offset));
}

function buildFrame(frameIndex) {
const frame = baseGrid.map((row) => row.slice());
const angle = (frameIndex / FRAME_COUNT) * Math.PI * 2;
const bob = Math.round(Math.sin(angle) * 1);

let previousOffset = 0;

BANDS.forEach((band, index) => {
    let offset = Math.round(
    band.amplitude * Math.sin(angle - band.phase)
    );

    if (index > 0) {
    offset = clampOffset(offset, previousOffset);
    }

    previousOffset = offset;

    band.rows.forEach((rowIndex) => {
    frame[rowIndex] = shiftedRow(baseGrid[rowIndex], offset);
    });
});

return { grid: frame, bob };
}

const FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => buildFrame(i));

// phase: "typing" | "thinking" | "result" | "resetting" — drives the CSS
// animation state on the stage wrapper (see ParticleOctopus.css). The grid's
// own per-frame bob is JS-driven via inline transform, so the phase
// animation is applied one level up on .pixel-octopus-stage to avoid the
// two transforms fighting over the same element.
export default function PixelOctopus({ phase = "typing" }) {
const gridRef = useRef(null);
const squareRef = useRef(null);
const cellsRef = useRef([]);
const frameIndexRef = useRef(0);
const animationFrameRef = useRef(null);
const intervalRef = useRef(null);

useEffect(() => {
    const gridEl = gridRef.current;
    const square = squareRef.current;

    if (!gridEl || !square) return;

    const ROWS = baseGrid.length;
    const COLS = baseGrid[0].length;
    const gridSize = 500;
    const squareSize = 66;

    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridEl.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

    cellsRef.current = [];

    for (let r = 0; r < ROWS; r++) {
    const rowEls = [];

    for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = baseGrid[r][c];
        gridEl.appendChild(cell);
        rowEls.push(cell);
    }

    cellsRef.current.push(rowEls);
    }

    const showFrame = (frame) => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
        const cell = cellsRef.current[r][c];
        const cls = frame.grid[r][c];

        if (cell.className !== cls) {
            cell.className = cls;
        }
        }
    }

    gridEl.style.transform = `translateY(${frame.bob}px)`;
    };

    showFrame(FRAMES[0]);

    intervalRef.current = window.setInterval(() => {
    frameIndexRef.current =
        (frameIndexRef.current + 1) % FRAMES.length;

    showFrame(FRAMES[frameIndexRef.current]);
    }, FRAME_MS);

    const cellW = gridSize / COLS;
    const cellH = gridSize / ROWS;

    const HANDS = [
    { x: 3.7 * cellW, y: 16.2 * cellH },
    { x: 19.3 * cellW, y: 16.2 * cellH }
    ];

    const CATCH_RADIUS = 52;
    const HOLD_DURATION = 0.55;

    let sx = gridSize * 0.15;
    let sy = gridSize * 0.55;
    let vx = 2.6;
    let vy = -1.8;

    const gravity = 0.12;
    const floorY = gridSize * 0.84 - squareSize;
    const ceilY = gridSize * 0.32;

    let squareState = "free";
    let heldHand = null;
    let heldTimer = 0;
    let releaseCooldown = 0;

    let startTime = null;
    let lastT = 0;

    const stepSquare = (tSeconds, dt) => {
    if (releaseCooldown > 0) {
        releaseCooldown -= dt;
    }

    if (squareState === "held") {
        heldTimer += dt;

        const bob = Math.sin(tSeconds * 6) * 4;

        sx = heldHand.x - squareSize / 2 + bob;
        sy = heldHand.y - squareSize / 2 + Math.abs(bob) * 0.5;

        if (heldTimer >= HOLD_DURATION) {
        squareState = "free";
        releaseCooldown = 0.6;

        const dir = heldHand.x < gridSize / 2 ? 1 : -1;

        vx = dir * 3.2;
        vy = -3.5;
        }
    } else {
        vy += gravity;
        sx += vx;
        sy += vy;

        if (sy > floorY) {
        sy = floorY;
        vy = -Math.abs(vy) * 0.92 - 0.4;
        }

        if (sy < ceilY) {
        sy = ceilY;
        vy = Math.abs(vy);
        }

        if (sx < 0 || sx > gridSize - squareSize) {
        vx = -vx;
        sx = Math.max(0, Math.min(sx, gridSize - squareSize));
        }

        if (releaseCooldown <= 0) {
        const cubeCenterX = sx + squareSize / 2;
        const cubeCenterY = sy + squareSize / 2;

        for (const hand of HANDS) {
            const dx = cubeCenterX - hand.x;
            const dy = cubeCenterY - hand.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < CATCH_RADIUS) {
            squareState = "held";
            heldHand = hand;
            heldTimer = 0;
            break;
            }
        }
        }
    }

    const rotation =
        squareState === "held"
        ? Math.sin(tSeconds * 6) * 15
        : (sx + sy) * 0.6;

    square.style.transform =
        `translate(${sx}px, ${sy}px) rotate(${rotation}deg)`;
    };

    const squareLoop = (now) => {
    if (startTime === null) {
        startTime = now;
    }

    const tSeconds = (now - startTime) / 1000;
    const dt = Math.min(tSeconds - lastT, 0.05);
    lastT = tSeconds;

    stepSquare(tSeconds, dt);
    animationFrameRef.current = requestAnimationFrame(squareLoop);
    };

    animationFrameRef.current = requestAnimationFrame(squareLoop);

    return () => {
    if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
    }

    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    gridEl.replaceChildren();
    cellsRef.current = [];
    };
}, []);

return (
    <div className="pixel-octopus-root">
    <div className={`pixel-octopus-stage is-${phase}`}>
        <div ref={gridRef} className="pixel-octopus-grid" />
        <div ref={squareRef} className="pixel-octopus-square" />
    </div>
    </div>
);
}