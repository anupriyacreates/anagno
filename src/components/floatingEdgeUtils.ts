import { Position, type InternalNode, type Node } from "@xyflow/react";

// Standard "floating edge" math: find where a line between two node centres
// crosses each node's border, so edges attach to the nearest side and stay
// clean as nodes are moved or resized.
function getNodeIntersection(
  intersectionNode: InternalNode<Node>,
  targetNode: InternalNode<Node>,
) {
  const w = (intersectionNode.measured.width ?? 0) / 2;
  const h = (intersectionNode.measured.height ?? 0) / 2;
  const i = intersectionNode.internals.positionAbsolute;
  const t = targetNode.internals.positionAbsolute;
  const tw = (targetNode.measured.width ?? 0) / 2;
  const th = (targetNode.measured.height ?? 0) / 2;

  const x2 = i.x + w;
  const y2 = i.y + h;
  const x1 = t.x + tw;
  const y1 = t.y + th;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = 2 * w * (xx3 + yy3) * 0.5 + x2;
  const y = 2 * h * (-xx3 + yy3) * 0.5 + y2;

  return { x, y };
}

function getEdgePosition(
  node: InternalNode<Node>,
  point: { x: number; y: number },
): Position {
  const n = node.internals.positionAbsolute;
  const w = node.measured.width ?? 0;
  const h = node.measured.height ?? 0;
  const px = Math.round(point.x);
  const py = Math.round(point.y);
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + w - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + h - 1) return Position.Bottom;
  return Position.Top;
}

export function getEdgeParams(
  source: InternalNode<Node>,
  target: InternalNode<Node>,
) {
  const sp = getNodeIntersection(source, target);
  const tp = getNodeIntersection(target, source);
  return {
    sx: sp.x,
    sy: sp.y,
    tx: tp.x,
    ty: tp.y,
    sourcePos: getEdgePosition(source, sp),
    targetPos: getEdgePosition(target, tp),
  };
}
