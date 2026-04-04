import { useCallback, useRef } from "react";
import type { DiagramElement, Viewport } from "@packages/diagram";
import { getAnchorPoint, getElementCenter } from "@packages/diagram";
import type { CanvasAction } from "./useCanvasReducer";

interface DragState {
  /** IDs of elements being dragged */
  elementIds: string[];
  /** Canvas-space position where drag started */
  startCanvasPoint: { x: number; y: number };
  /** Snapshot of element positions at drag start (id → {x, y} or equivalent) */
  startPositions: Map<string, Record<string, number>>;
}

/**
 * Hook for dragging selected elements to reposition them.
 * Returns callbacks to start, continue, and end a drag operation.
 */
export function useElementDrag(
  elements: DiagramElement[],
  dispatch: React.Dispatch<CanvasAction>,
) {
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback(
    (elementIds: string[], canvasPoint: { x: number; y: number }) => {
      const startPositions = new Map<string, Record<string, number>>();

      for (const id of elementIds) {
        const el = elements.find((e) => e.id === id);
        if (!el) continue;

        switch (el.type) {
          case "rectangle":
          case "cylinder":
            startPositions.set(id, { x: el.x, y: el.y });
            break;
          case "circle":
            startPositions.set(id, { cx: el.cx, cy: el.cy });
            break;
          case "text":
            startPositions.set(id, { x: el.x, y: el.y });
            break;
          case "arrow":
            startPositions.set(id, {
              startX: el.startX,
              startY: el.startY,
              endX: el.endX,
              endY: el.endY,
            });
            break;
        }
      }

      dragRef.current = {
        elementIds,
        startCanvasPoint: canvasPoint,
        startPositions,
      };
    },
    [elements],
  );

  const continueDrag = useCallback(
    (canvasPoint: { x: number; y: number }) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = canvasPoint.x - drag.startCanvasPoint.x;
      const dy = canvasPoint.y - drag.startCanvasPoint.y;

      const updates: { id: string; patch: Partial<DiagramElement> }[] = [];

      for (const id of drag.elementIds) {
        const startPos = drag.startPositions.get(id);
        if (!startPos) continue;

        const el = elements.find((e) => e.id === id);
        if (!el) continue;

        switch (el.type) {
          case "rectangle":
          case "cylinder":
            updates.push({
              id,
              patch: { x: startPos.x + dx, y: startPos.y + dy },
            });
            break;
          case "circle":
            updates.push({
              id,
              patch: { cx: startPos.cx + dx, cy: startPos.cy + dy },
            });
            break;
          case "text":
            updates.push({
              id,
              patch: { x: startPos.x + dx, y: startPos.y + dy },
            });
            break;
          case "arrow":
            updates.push({
              id,
              patch: {
                startX: startPos.startX + dx,
                startY: startPos.startY + dy,
                endX: startPos.endX + dx,
                endY: startPos.endY + dy,
              },
            });
            break;
        }
      }

      if (updates.length > 0) {
        dispatch({ type: "UPDATE_ELEMENTS", updates });
      }
    },
    [elements, dispatch],
  );

  const endDrag = useCallback(() => {
    if (!dragRef.current) return false;

    // After drag, recalculate arrow anchor points for bound arrows
    const draggedIds = new Set(dragRef.current.elementIds);
    recalculateArrowAnchors(draggedIds, elements, dispatch);

    dragRef.current = null;
    return true;
  }, [elements, dispatch]);

  const isDragging = useCallback(() => dragRef.current !== null, []);

  return { startDrag, continueDrag, endDrag, isDragging };
}

/**
 * After moving elements, recalculate anchor points for any arrows
 * bound to those elements.
 */
function recalculateArrowAnchors(
  movedIds: Set<string>,
  elements: DiagramElement[],
  dispatch: React.Dispatch<CanvasAction>,
) {
  const updates: { id: string; patch: Partial<DiagramElement> }[] = [];

  for (const el of elements) {
    if (el.type !== "arrow") continue;

    const startBound = el.startBinding && movedIds.has(el.startBinding);
    const endBound = el.endBinding && movedIds.has(el.endBinding);

    if (!startBound && !endBound) continue;

    const patch: Record<string, number | undefined> = {};
    const startTarget = el.startBinding
      ? elements.find((e) => e.id === el.startBinding)
      : null;
    const endTarget = el.endBinding
      ? elements.find((e) => e.id === el.endBinding)
      : null;

    // Determine the "other" end's position for anchor calculation
    if (
      startBound &&
      startTarget &&
      startTarget.type !== "text" &&
      startTarget.type !== "arrow"
    ) {
      const otherEnd = endTarget
        ? getElementCenter(endTarget)
        : { x: el.endX, y: el.endY };
      const anchor = getAnchorPoint(startTarget, otherEnd);
      patch.startX = anchor.x;
      patch.startY = anchor.y;
    }

    if (
      endBound &&
      endTarget &&
      endTarget.type !== "text" &&
      endTarget.type !== "arrow"
    ) {
      const otherEnd = startTarget
        ? getElementCenter(startTarget)
        : { x: el.startX, y: el.startY };
      const anchor = getAnchorPoint(endTarget, otherEnd);
      patch.endX = anchor.x;
      patch.endY = anchor.y;
    }

    if (Object.keys(patch).length > 0) {
      updates.push({ id: el.id, patch });
    }
  }

  if (updates.length > 0) {
    dispatch({ type: "UPDATE_ELEMENTS", updates });
  }
}
