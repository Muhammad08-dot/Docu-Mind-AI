import { useState, useEffect, useRef } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import type { Document } from '../types';


interface KnowledgeGraphProps {
  documents: Document[];
  isOpen: boolean;
  onClose: () => void;
}

interface Node {
  id: string;
  label: string;
  type: 'document' | 'topic' | 'entity';
  x: number;
  y: number;
  color: string;
  size: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

// Generate mock knowledge graph data
const generateGraphData = (documents: Document[]): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Topic clusters
  const topics = [
    { id: 'topic-hr', label: 'HR Policy', color: '#3b82f6' },
    { id: 'topic-ml', label: 'Machine Learning', color: '#22c55e' },
    { id: 'topic-legal', label: 'Legal', color: '#f59e0b' },
    { id: 'topic-urdu', label: 'Urdu Docs', color: '#ef4444' },
  ];

  // Add topic nodes in center
  topics.forEach((topic, i) => {
    const angle = (i / topics.length) * Math.PI * 2;
    nodes.push({
      id: topic.id,
      label: topic.label,
      type: 'topic',
      x: 250 + Math.cos(angle) * 80,
      y: 200 + Math.sin(angle) * 80,
      color: topic.color,
      size: 30,
    });
  });

  // Add document nodes around topics
  documents.forEach((doc, i) => {
    let topicId = 'topic-hr';
    if (doc.filename.toLowerCase().includes('attention') || doc.filename.toLowerCase().includes('bert')) {
      topicId = 'topic-ml';
    } else if (doc.filename.toLowerCase().includes('legal')) {
      topicId = 'topic-legal';
    } else if (/[\u0600-\u06FF]/.test(doc.filename)) {
      topicId = 'topic-urdu';
    }

    const topicNode = nodes.find((n) => n.id === topicId);
    if (topicNode) {
      const angle = (i / documents.length) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 120 + Math.random() * 40;
      
      nodes.push({
        id: doc.id,
        label: doc.filename.length > 20 ? doc.filename.slice(0, 17) + '...' : doc.filename,
        type: 'document',
        x: topicNode.x + Math.cos(angle) * distance,
        y: topicNode.y + Math.sin(angle) * distance,
        color: topicNode.color,
        size: 15 + (doc.chunks / 100) * 5,
      });

      edges.push({
        source: topicId,
        target: doc.id,
        strength: 0.5 + Math.random() * 0.5,
      });
    }
  });

  // Add some cross-document relationships
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      if (Math.random() > 0.7) {
        edges.push({
          source: documents[i].id,
          target: documents[j].id,
          strength: 0.2 + Math.random() * 0.3,
        });
      }
    }
  }

  return { nodes, edges };
};

export default function KnowledgeGraph({ documents, isOpen, onClose }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  useEffect(() => {
    if (isOpen && documents.length > 0) {
      setGraphData(generateGraphData(documents));
    }
  }, [isOpen, documents]);

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(zoom, zoom);

      // Draw edges
      graphData.edges.forEach((edge) => {
        const source = graphData.nodes.find((n) => n.id === edge.source);
        const target = graphData.nodes.find((n) => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = `rgba(100, 116, 139, ${edge.strength * 0.5})`;
          ctx.lineWidth = edge.strength * 2;
          ctx.stroke();
        }
      });

      // Draw nodes
      graphData.nodes.forEach((node) => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.size * 1.5
        );
        gradient.addColorStop(0, node.color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#e2e8f0';
        ctx.font = node.type === 'topic' ? 'bold 11px Inter' : '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.size + 14);
      });

      ctx.restore();
    };

    draw();

    // Handle mouse move for hover detection
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      const hovered = graphData.nodes.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < node.size;
      });

      setHoveredNode(hovered || null);
      canvas.style.cursor = hovered ? 'pointer' : 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [graphData, zoom, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[80vh] bg-surface-light border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border glass">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">Knowledge Graph</h3>
            <span className="text-xs text-dark-500">
              {graphData.nodes.length} nodes • {graphData.edges.length} connections
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-dark-400 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 h-[calc(100%-60px)]">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full"
          />

          {/* Hover tooltip */}
          {hoveredNode && (
            <div
              className="absolute pointer-events-none px-3 py-2 rounded-lg bg-surface-card border border-border shadow-xl"
              style={{
                left: hoveredNode.x * zoom + 20,
                top: hoveredNode.y * zoom - 20,
              }}
            >
              <p className="text-xs font-medium text-white">{hoveredNode.label}</p>
              <p className="text-[10px] text-dark-400 capitalize">{hoveredNode.type}</p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-surface-card/90 border border-border backdrop-blur">
            <p className="text-[10px] font-semibold text-dark-400 mb-2">LEGEND</p>
            <div className="space-y-1.5">
              {[
                { color: '#3b82f6', label: 'HR & Policy' },
                { color: '#22c55e', label: 'Machine Learning' },
                { color: '#f59e0b', label: 'Legal' },
                { color: '#ef4444', label: 'Urdu Documents' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-dark-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
