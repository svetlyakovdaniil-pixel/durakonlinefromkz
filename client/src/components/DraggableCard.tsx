import { useRef, useState, useCallback, useEffect } from 'react';
import type { Card } from '../../../shared/gameTypes';
import PlayingCard from './PlayingCard';

interface DraggableCardProps {
  card: Card;
  playable: boolean;
  selected: boolean;
  isPassThrough?: boolean;
  deckStyle?: 'classic' | 'custom';
  onClick: () => void;
  /** Called when card is dropped on the battlefield drop zone */
  onDrop?: (card: Card, dropX: number, dropY: number) => boolean;
  /** ID of the battlefield drop zone element */
  dropZoneId?: string;
}

export default function DraggableCard({
  card, playable, selected, isPassThrough, deckStyle, onClick, onDrop, dropZoneId = 'battlefield-drop-zone',
}: DraggableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [returning, setReturning] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);
  const hasMoved = useRef(false);
  const origRect = useRef<DOMRect | null>(null);

  // Check if a point is inside the drop zone
  const isOverDropZone = useCallback((clientX: number, clientY: number) => {
    const dropZone = document.getElementById(dropZoneId);
    if (!dropZone) return false;
    const rect = dropZone.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }, [dropZoneId]);

  // Start drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!playable || !onDrop) return;
    const el = cardRef.current;
    if (!el) return;

    e.preventDefault();
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    origRect.current = rect;
    startPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
    hasMoved.current = false;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragPos({
      x: rect.left,
      y: rect.top,
    });
  }, [playable, onDrop]);

  // Move drag
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current || !origRect.current) return;
    if (!playable || !onDrop) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only start dragging after 8px movement
    if (!dragging && dist < 8) return;

    if (!dragging) {
      setDragging(true);
    }
    hasMoved.current = true;

    setDragPos({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  }, [dragging, dragOffset, playable, onDrop]);

  // End drag
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!playable) return;

    const el = cardRef.current;
    if (el) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
    }

    if (!dragging || !hasMoved.current) {
      // It was a click, not a drag
      setDragging(false);
      startPos.current = { x: 0, y: 0 };
      origRect.current = null;
      if (!hasMoved.current) {
        onClick();
      }
      return;
    }

    // Check if dropped on battlefield
    const overDrop = isOverDropZone(e.clientX, e.clientY);

    if (overDrop && onDrop) {
      const accepted = onDrop(card, e.clientX, e.clientY);
      if (accepted) {
        // Card was accepted — just hide it
        setDragging(false);
        startPos.current = { x: 0, y: 0 };
        origRect.current = null;
        return;
      }
    }

    // Card was rejected or dropped outside — animate return
    setReturning(true);
    if (origRect.current) {
      setDragPos({
        x: origRect.current.left,
        y: origRect.current.top,
      });
    }

    setTimeout(() => {
      setDragging(false);
      setReturning(false);
      startPos.current = { x: 0, y: 0 };
      origRect.current = null;
    }, 300);
  }, [dragging, isOverDropZone, onDrop, card, onClick, playable]);

  // Cancel on pointer cancel
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    setReturning(true);
    if (origRect.current) {
      setDragPos({
        x: origRect.current.left,
        y: origRect.current.top,
      });
    }
    setTimeout(() => {
      setDragging(false);
      setReturning(false);
      startPos.current = { x: 0, y: 0 };
      origRect.current = null;
    }, 300);
  }, []);

  return (
    <>
      {/* Placeholder to keep layout space when dragging */}
      <div
        ref={cardRef}
        className={`relative flex-shrink-0 transition-transform duration-150 touch-none ${dragging ? 'opacity-30' : ''}`}
        style={{
          transform: selected && !dragging ? 'translateY(-8px)' : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {!dragging && (
          <PlayingCard
            card={card}
            playable={playable}
            selected={selected}
            deckStyle={deckStyle}
            onClick={!onDrop ? onClick : undefined}
          />
        )}
        {dragging && (
          <PlayingCard
            card={card}
            playable={false}
            selected={false}
            deckStyle={deckStyle}
            className="opacity-30"
          />
        )}
        {isPassThrough && !selected && !dragging && (
          <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-600 rounded-full flex items-center justify-center border border-yellow-400">
            <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
      </div>

      {/* Floating dragged card */}
      {dragging && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            transition: returning ? 'left 0.3s ease-out, top 0.3s ease-out' : 'none',
            transform: 'rotate(-5deg) scale(1.1)',
          }}
        >
          <PlayingCard
            card={card}
            playable={false}
            selected={true}
            deckStyle={deckStyle}
          />
        </div>
      )}
    </>
  );
}
