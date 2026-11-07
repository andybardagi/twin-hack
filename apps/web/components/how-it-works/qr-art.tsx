import { cn } from "@workspace/ui/lib/utils";

const gridSize = 25;
const finderSize = 7;
const finderOrigins = [
  [0, 0],
  [gridSize - finderSize, 0],
  [0, gridSize - finderSize],
];

function isInsideFinder(x: number, y: number) {
  return finderOrigins.some(
    ([originX = 0, originY = 0]) =>
      x >= originX - 1 &&
      x <= originX + finderSize &&
      y >= originY - 1 &&
      y <= originY + finderSize,
  );
}

const cells = Array.from({ length: gridSize * gridSize }, (_, index) => ({
  x: index % gridSize,
  y: Math.floor(index / gridSize),
})).filter(({ x, y }) => !isInsideFinder(x, y) && (x * 5 + y * 3 + x * y) % 3 !== 0);

/** Decorative pattern for page mockups. It looks like a QR code but encodes nothing. */
function QrArt({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      shapeRendering="crispEdges"
      className={cn("fill-foreground", className)}
    >
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
      {finderOrigins.map(([x = 0, y = 0]) => (
        <path
          key={`${x}-${y}`}
          fillRule="evenodd"
          d={`M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`}
        />
      ))}
    </svg>
  );
}

export { QrArt };
