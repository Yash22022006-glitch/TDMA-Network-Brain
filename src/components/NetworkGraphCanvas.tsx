import React, { useState, useMemo, useRef } from 'react';
import { RadioNode, CommunicationEdge, ConflictEdge } from '../types/tdma';
import { getSlotColor } from '../utils/tdmaEngine';
import { Move, Magnet, Info } from 'lucide-react';

interface NetworkGraphCanvasProps {
  nodes: RadioNode[];
  communicationEdges: CommunicationEdge[];
  conflictEdges: ConflictEdge[];
  nodeToSlot: Record<string, number>;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  onUpdateNodePosition?: (nodeId: string, newX: number, newY: number) => void;
  viewMode?: 'topology' | 'conflict' | 'combined' | 'slots';
  show2HopLinks?: boolean;
  show1HopLinks?: boolean;
  showRangeCircles?: boolean;
  radioRangeMeters?: number;
  highlightedSlot?: number | null;
  activeTransmitters?: Set<string>;
  height?: number | string;
  isDraggable?: boolean;
  isAddingMode?: boolean;
  onCanvasClick?: (x: number, y: number) => void;
}

export const NetworkGraphCanvas: React.FC<NetworkGraphCanvasProps> = ({
  nodes,
  communicationEdges,
  conflictEdges,
  nodeToSlot,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  viewMode = 'topology',
  show2HopLinks = true,
  show1HopLinks = true,
  showRangeCircles = true,
  radioRangeMeters = 500,
  highlightedSlot = null,
  activeTransmitters,
  height = 520,
  isDraggable = true,
  isAddingMode = false,
  onCanvasClick
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const svgRef = useRef<SVGSVGElement>(null);

  // Compute fixed or adaptive bounding box with comfortable margins
  const { minX, maxX, minY, maxY } = useMemo(() => {
    let min_x = 0;
    let max_x = 1200;
    let min_y = 0;
    let max_y = 1000;

    if (nodes.length > 0) {
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      min_x = Math.min(...xs, 0);
      max_x = Math.max(...xs, 1200);
      min_y = Math.min(...ys, 0);
      max_y = Math.max(...ys, 1000);
    }

    const padding = 100;
    return {
      minX: min_x - padding,
      maxX: max_x + padding,
      minY: min_y - padding,
      maxY: max_y + padding
    };
  }, [nodes]);

  // Coordinate conversion to SVG space (viewBox: 0 0 1000 600)
  const svgWidth = 1000;
  const svgHeight = 600;

  const toSvgX = (x: number) => {
    return ((x - minX) / (maxX - minX)) * (svgWidth - 120) + 60;
  };

  const toSvgY = (y: number) => {
    // Invert Y so 0 is at bottom (standard Cartesian plane)
    return svgHeight - 40 - ((y - minY) / (maxY - minY)) * (svgHeight - 80);
  };

  // Convert SVG coordinate back to physical meters (X, Y)
  const fromSvgCoords = (svgX: number, svgY: number) => {
    const realX = minX + ((svgX - 60) / (svgWidth - 120)) * (maxX - minX);
    const realY = minY + ((svgHeight - 40 - svgY) / (svgHeight - 80)) * (maxY - minY);
    return {
      x: Math.round(Math.max(0, Math.min(1300, realX))),
      y: Math.round(Math.max(0, Math.min(1100, realY)))
    };
  };

  const nodeMap = useMemo(() => {
    return new Map<string, RadioNode>(nodes.map(n => [n.id, n]));
  }, [nodes]);

  // Filter 2-hop edges
  const twoHopEdges = useMemo(() => {
    return conflictEdges.filter(e => e.type === '2-hop');
  }, [conflictEdges]);

  // Determine active highlights for dragged, hovered, or selected node
  const activeFocusId = draggingNodeId || hoveredNodeId || selectedNodeId;

  const focusNeighbors = useMemo(() => {
    if (!activeFocusId) return { oneHop: new Set<string>(), twoHop: new Set<string>() };
    const oneHop = new Set<string>();
    const twoHop = new Set<string>();

    communicationEdges.forEach(e => {
      if (e.u === activeFocusId) oneHop.add(e.v);
      if (e.v === activeFocusId) oneHop.add(e.u);
    });

    conflictEdges.forEach(e => {
      if (e.type === '2-hop') {
        if (e.u === activeFocusId) twoHop.add(e.v);
        if (e.v === activeFocusId) twoHop.add(e.u);
      }
    });

    return { oneHop, twoHop };
  }, [activeFocusId, communicationEdges, conflictEdges]);

  // Range scale factor for SVG radius (500m)
  const meterScale = useMemo(() => {
    const xDistPx = toSvgX(radioRangeMeters) - toSvgX(0);
    return Math.abs(xDistPx);
  }, [radioRangeMeters, minX, maxX]);

  // Mouse / Pointer handlers for dragging
  const handlePointerDown = (nodeId: string, e: React.PointerEvent) => {
    if (!isDraggable || !onUpdateNodePosition) {
      onSelectNode?.(nodeId);
      return;
    }
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingNodeId(nodeId);
    onSelectNode?.(nodeId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingNodeId || !onUpdateNodePosition || !svgRef.current) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const coords = fromSvgCoords(svgPt.x, svgPt.y);
    const finalX = snapToGrid ? Math.round(coords.x / 10) * 10 : coords.x;
    const finalY = snapToGrid ? Math.round(coords.y / 10) * 10 : coords.y;

    onUpdateNodePosition(draggingNodeId, finalX, finalY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingMode || !onCanvasClick || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());
    const coords = fromSvgCoords(svgPt.x, svgPt.y);
    const finalX = snapToGrid ? Math.round(coords.x / 10) * 10 : coords.x;
    const finalY = snapToGrid ? Math.round(coords.y / 10) * 10 : coords.y;
    onCanvasClick(finalX, finalY);
  };

  const draggingNode = draggingNodeId ? nodeMap.get(draggingNodeId) : null;
  const focusNode = activeFocusId ? nodeMap.get(activeFocusId) : null;

  return (
    <div className="relative w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs select-none">
      {/* Interactive Drag Bar Overlay */}
      {isDraggable && onUpdateNodePosition && (
        <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs">
          <div className="flex items-center space-x-1 text-slate-500 font-medium">
            <Move className="w-3.5 h-3.5 text-blue-600" />
            <span>Drag points to adjust</span>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              snapToGrid
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Snap coordinates to nearest 10 meters"
          >
            <Magnet className="w-3 h-3" />
            <span>10m Snap</span>
          </button>
        </div>
      )}

      {/* Real-time Dragging Coordinates Pill */}
      {draggingNode && (
        <div className="absolute top-3 left-3 z-10 bg-slate-900 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-2 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-blue-400">{draggingNode.name}</span>
          <span>
            X: <strong className="text-white">{draggingNode.x}m</strong>, Y:{' '}
            <strong className="text-white">{draggingNode.y}m</strong>
          </span>
          <span className="text-slate-400">| Slot {nodeToSlot[draggingNode.id] ?? '?'}</span>
        </div>
      )}

      {/* Adding Mode Indicator */}
      {isAddingMode && (
        <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse border border-blue-400">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Click anywhere on grid to place node</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`w-full h-auto block ${
          isAddingMode ? 'cursor-crosshair' : draggingNodeId ? 'cursor-grabbing' : 'cursor-default'
        }`}
        style={{ maxHeight: height }}
        onClick={handleSvgClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {/* Subtle engineering grid */}
          <pattern id="grid-pattern" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>
          <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width={svgWidth} height={svgHeight} fill="#fafafa" />
        <rect width={svgWidth} height={svgHeight} fill="url(#grid-pattern)" />

        {/* Axis Labels & Grid markers */}
        <g className="text-[10px] font-mono fill-slate-400 select-none">
          {[0, 200, 400, 600, 800, 1000, 1200].map(val => {
            const xPos = toSvgX(val);
            if (xPos < 50 || xPos > svgWidth - 30) return null;
            return (
              <g key={`x-${val}`}>
                <line x1={xPos} y1={20} x2={xPos} y2={svgHeight - 35} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={xPos} y={svgHeight - 18} textAnchor="middle">{val}</text>
              </g>
            );
          })}
          {[0, 200, 400, 600, 800, 1000].map(val => {
            const yPos = toSvgY(val);
            if (yPos < 30 || yPos > svgHeight - 40) return null;
            return (
              <g key={`y-${val}`}>
                <line x1={50} y1={yPos} x2={svgWidth - 20} y2={yPos} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={38} y={yPos + 3} textAnchor="end">{val}</text>
              </g>
            );
          })}
          {/* Axis Titles */}
          <text x={svgWidth / 2} y={svgHeight - 4} textAnchor="middle" className="font-sans font-semibold fill-slate-500 text-[11px]">
            X Coordinate (m)
          </text>
          <text
            x={15}
            y={svgHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 15 ${svgHeight / 2})`}
            className="font-sans font-semibold fill-slate-500 text-[11px]"
          >
            Y Coordinate (m)
          </text>
        </g>

        {/* Crosshair guide lines when dragging */}
        {draggingNode && (
          <g className="pointer-events-none">
            <line
              x1={toSvgX(draggingNode.x)}
              y1={20}
              x2={toSvgX(draggingNode.x)}
              y2={svgHeight - 35}
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            <line
              x1={50}
              y1={toSvgY(draggingNode.y)}
              x2={svgWidth - 20}
              y2={toSvgY(draggingNode.y)}
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.6"
            />
          </g>
        )}

        {/* 500m Radio Coverage Circle for active/selected/dragged node */}
        {showRangeCircles && focusNode && (
          <g className="pointer-events-none transition-all duration-75">
            <circle
              cx={toSvgX(focusNode.x)}
              cy={toSvgY(focusNode.y)}
              r={meterScale}
              fill="#3b82f6"
              fillOpacity="0.05"
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Radius label */}
            <text
              x={toSvgX(focusNode.x) + meterScale * 0.707 + 5}
              y={toSvgY(focusNode.y) - meterScale * 0.707 - 5}
              fill="#2563eb"
              className="text-[9px] font-mono font-bold"
            >
              {radioRangeMeters}m Range
            </text>
          </g>
        )}

        {/* 2-Hop Conflict Links (Red Dashed) */}
        {(viewMode === 'conflict' || viewMode === 'combined' || (viewMode === 'topology' && show2HopLinks)) &&
          twoHopEdges.map((e, idx) => {
            const u = nodeMap.get(e.u);
            const v = nodeMap.get(e.v);
            if (!u || !v) return null;

            const isRelated =
              activeFocusId && (e.u === activeFocusId || e.v === activeFocusId);
            const isFaded = activeFocusId && !isRelated;

            return (
              <line
                key={`2hop-${e.u}-${e.v}-${idx}`}
                x1={toSvgX(u.x)}
                y1={toSvgY(u.y)}
                x2={toSvgX(v.x)}
                y2={toSvgY(v.y)}
                stroke="#f43f5e"
                strokeWidth={isRelated ? 2.5 : 1.4}
                strokeDasharray="4 4"
                strokeOpacity={isFaded ? 0.15 : isRelated ? 0.9 : 0.45}
                className="transition-all duration-75"
              />
            );
          })}

        {/* 1-Hop Communication Links (Blue Solid) */}
        {(viewMode === 'topology' || viewMode === 'combined' || show1HopLinks) &&
          communicationEdges.map((e, idx) => {
            const u = nodeMap.get(e.u);
            const v = nodeMap.get(e.v);
            if (!u || !v) return null;

            const isRelated =
              activeFocusId && (e.u === activeFocusId || e.v === activeFocusId);
            const isFaded = activeFocusId && !isRelated;

            return (
              <g key={`comm-${e.u}-${e.v}-${idx}`}>
                <line
                  x1={toSvgX(u.x)}
                  y1={toSvgY(u.y)}
                  x2={toSvgX(v.x)}
                  y2={toSvgY(v.y)}
                  stroke="#2563eb"
                  strokeWidth={isRelated ? 3.2 : 1.8}
                  strokeOpacity={isFaded ? 0.2 : isRelated ? 1 : 0.75}
                  className="transition-all duration-75"
                />
              </g>
            );
          })}

        {/* Radio Nodes */}
        {nodes.map(node => {
          const cx = toSvgX(node.x);
          const cy = toSvgY(node.y);
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isDragging = draggingNodeId === node.id;
          const isFocus = isSelected || isHovered || isDragging;
          const is1HopNeighbor = focusNeighbors.oneHop.has(node.id);
          const is2HopNeighbor = focusNeighbors.twoHop.has(node.id);
          const isTransmitting = activeTransmitters?.has(node.id);

          const slot = nodeToSlot[node.id];
          const hasSlot = slot !== undefined;
          const isSlotHighlighted =
            highlightedSlot !== null && highlightedSlot !== undefined && slot === highlightedSlot;

          // Color calculation
          let nodeFill = '#2563eb';
          if (viewMode === 'conflict') {
            nodeFill = '#f43f5e';
          } else if (hasSlot && (viewMode === 'slots' || viewMode === 'combined')) {
            nodeFill = getSlotColor(slot);
          }

          if (isSlotHighlighted) {
            nodeFill = '#e11d48';
          }

          return (
            <g
              key={node.id}
              className={`transition-transform duration-75 ${
                isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
              }`}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onPointerDown={e => handlePointerDown(node.id, e)}
            >
              {/* Active transmission ripple effect */}
              {isTransmitting && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={26}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="animate-ping"
                  opacity="0.75"
                />
              )}

              {/* Selection, Dragging, or Neighbor Halo */}
              {isFocus && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isDragging ? 26 : 22}
                  fill={nodeFill}
                  fillOpacity={isDragging ? '0.35' : '0.25'}
                  stroke={nodeFill}
                  strokeWidth={isDragging ? '3' : '2'}
                />
              )}
              {is1HopNeighbor && !isFocus && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={20}
                  fill="#2563eb"
                  fillOpacity="0.15"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />
              )}
              {is2HopNeighbor && !is1HopNeighbor && !isFocus && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={20}
                  fill="#f43f5e"
                  fillOpacity="0.15"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Main Node Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={isDragging ? 18 : 16}
                fill={nodeFill}
                filter="url(#node-shadow)"
                stroke="#ffffff"
                strokeWidth={isFocus ? '3' : '2'}
                className="transition-all duration-75"
              />

              {/* Node ID label */}
              <text
                x={cx}
                y={cy + 4.5}
                textAnchor="middle"
                fill="#ffffff"
                className="text-[10px] font-bold font-sans pointer-events-none select-none"
              >
                {node.name.length > 4 ? node.name.replace(/[^0-9]/g, '') : node.name}
              </text>

              {/* Slot Badge when slot view enabled */}
              {hasSlot && (
                <g transform={`translate(${cx + 10}, ${cy - 12})`}>
                  <rect
                    x="-6"
                    y="-6"
                    width="14"
                    height="14"
                    rx="7"
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <text
                    x="1"
                    y="4.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    className="text-[8px] font-bold font-mono"
                  >
                    {slot}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
