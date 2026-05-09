import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Bubble } from '../../types';
import { BubbleView } from './BubbleView';

interface BubbleGridProps {
  grid: (Bubble | null)[][];
  poppingIds: Set<string>;
  fallingIds: Set<string>;
  // Snapshot of bubbles at the moment of blast — so we can animate them
  // even after they're removed from the grid
  blastSnapshot: Map<string, Bubble>;
}

export const BubbleGrid: React.FC<BubbleGridProps> = ({
  grid,
  poppingIds,
  fallingIds,
  blastSnapshot,
}) => {
  // Live grid bubbles (not popping/falling)
  const liveBubbles: Bubble[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell) liveBubbles.push(cell);
    }
  }

  // Ghost bubbles: currently animating out (popping or falling)
  const ghostBubbles: { bubble: Bubble; isPopping: boolean; isFalling: boolean }[] = [];
  for (const [id, bubble] of blastSnapshot) {
    const isPopping = poppingIds.has(id);
    const isFalling = fallingIds.has(id);
    if (isPopping || isFalling) {
      ghostBubbles.push({ bubble, isPopping, isFalling });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Live bubbles */}
      {liveBubbles.map(b => (
        <BubbleView key={b.id} color={b.color} kind={b.kind} x={b.x} y={b.y} />
      ))}
      {/* Animating-out bubbles (popping / falling) */}
      {ghostBubbles.map(({ bubble, isPopping, isFalling }) => (
        <BubbleView
          key={`ghost-${bubble.id}`}
          color={bubble.color}
          kind={bubble.kind}
          x={bubble.x}
          y={bubble.y}
          isPopping={isPopping}
          isFalling={isFalling}
        />
      ))}
    </View>
  );
};
