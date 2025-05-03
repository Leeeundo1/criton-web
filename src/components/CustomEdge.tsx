'use client';

import React from 'react';
import { getSmoothStepPath, EdgeProps, BaseEdge } from 'reactflow';

// Define the expected structure of edge data, including optional style props
interface CustomEdgeData {
  strokeColor?: string;
  strokeWidth?: number;
  // We can add more later, like label, labelStyle, etc.
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {}, // Default style object
  data, // Data object containing our custom style props
  markerEnd,
}: EdgeProps<CustomEdgeData>) {

  // Define default styles for the edge
  const defaultEdgeStyles = {
    strokeColor: '#b1b1b7', // Default grey color
    strokeWidth: 1.5,
  };

  // Merge data styles with defaults
  const edgeStyle = {
    stroke: data?.strokeColor || defaultEdgeStyles.strokeColor,
    strokeWidth: data?.strokeWidth || defaultEdgeStyles.strokeWidth,
    ...style, // Include any styles passed directly via the style prop
  };

  // Generate the SVG path string for the edge
  // You can swap getSmoothStepPath with getBezierPath, getStraightPath etc. if needed
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
  );
} 