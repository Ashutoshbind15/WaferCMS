import { useCallback, useRef, useState } from "react";
import type { DiagramElement, ArrowElement } from "@packages/diagram";
import {
  generateSeed,
  getAnchorPoint,
  getElementCenter,
} from "@packages/diagram";
import { hitTest } from "./hit-test";
import type { CanvasAction } from "./useCanvasReducer";

interface ArrowStartState {
  /** Canvas-space position of the first click */
  point: { x: number; y: number };
  /** Element ID if the click landed on a shape, undefined if free-floating */
  binding?: string;
}

/**
 * Hook for two-click arrow creation.
 *
 * Arrow tool flow:
 * 1. First click sets start point (optionally bound to an element)
 * 2. Mouse move shows a preview line from start to cursor
 * 3. Second click sets end point (optionally bound to an element)
 * 4. Arrow element is created and tool switches to select
 */
export function useArrowCreation(
  elements: DiagramElement[],
  dispatch: React.Dispatch<CanvasAction>,
) {
  const [arrowStart, setArrowStart] = useState<ArrowStartState | null>(null);
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleArrowClick = useCallback(
    (canvasPoint: { x: number; y: number }) => {
      const hitElement = hitTest(canvasPoint, elements);
      // Only bind to shapes, not text or other arrows
      const bindableHit =
        hitElement && hitElement.type !== "text" && hitElement.type !== "arrow"
          ? hitElement
          : null;

      if (!arrowStart) {
        // First click: set start point
        const startPoint = bindableHit
          ? getAnchorPoint(bindableHit, canvasPoint)
          : canvasPoint;

        setArrowStart({
          point: startPoint,
          binding: bindableHit?.id,
        });
        setPreviewEnd(canvasPoint);
      } else {
        // Second click: create the arrow
        const endPoint = bindableHit
          ? getAnchorPoint(bindableHit, arrowStart.point)
          : canvasPoint;

        // Recalculate start anchor now that we know the actual end target
        let startPoint = arrowStart.point;
        if (arrowStart.binding) {
          const startTarget = elements.find((e) => e.id === arrowStart.binding);
          if (
            startTarget &&
            startTarget.type !== "text" &&
            startTarget.type !== "arrow"
          ) {
            const endRef = bindableHit
              ? getElementCenter(bindableHit)
              : canvasPoint;
            startPoint = getAnchorPoint(startTarget, endRef);
          }
        }

        const arrow: ArrowElement = {
          id: crypto.randomUUID(),
          type: "arrow",
          seed: generateSeed(),
          startX: startPoint.x,
          startY: startPoint.y,
          endX: endPoint.x,
          endY: endPoint.y,
          startBinding: arrowStart.binding,
          endBinding: bindableHit?.id,
        };

        dispatch({ type: "ADD_ELEMENT", element: arrow });
        dispatch({ type: "SET_TOOL", tool: "select" });
        dispatch({ type: "SET_SELECTION", ids: [arrow.id] });

        // Reset
        setArrowStart(null);
        setPreviewEnd(null);
      }
    },
    [arrowStart, elements, dispatch],
  );

  const updatePreview = useCallback(
    (canvasPoint: { x: number; y: number }) => {
      if (arrowStart) {
        setPreviewEnd(canvasPoint);
      }
    },
    [arrowStart],
  );

  const cancelArrow = useCallback(() => {
    setArrowStart(null);
    setPreviewEnd(null);
  }, []);

  return {
    arrowStart,
    previewEnd,
    handleArrowClick,
    updatePreview,
    cancelArrow,
  };
}
