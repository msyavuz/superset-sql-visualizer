import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { QueryNode, QueryEdge } from './sqlParser';

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing: number;
  levelSpacing: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'TB',
  nodeSpacing: 100,
  levelSpacing: 150
};

export const layoutNodes = (nodes: QueryNode[], edges: QueryEdge[], options: LayoutOptions = defaultOptions): Node[] => {
  const g = new dagre.graphlib.Graph();
  
  g.setGraph({
    rankdir: options.direction,
    nodesep: options.nodeSpacing,
    ranksep: options.levelSpacing,
    marginx: 50,
    marginy: 50
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  nodes.forEach(node => {
    const width = getNodeWidth(node);
    const height = getNodeHeight(node);
    
    g.setNode(node.id, { 
      width, 
      height,
      type: node.type
    });
  });

  // Add edges to dagre graph
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(g);

  // Convert to ReactFlow nodes with calculated positions
  return nodes.map(node => {
    const nodeWithPosition = g.node(node.id);
    
    return {
      id: node.id,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
      data: { 
        label: node.label,
        details: formatNodeDetails(node),
        originalNode: node
      },
      style: getNodeStyle(node),
      type: 'default'
    };
  });
};

const getNodeWidth = (node: QueryNode): number => {
  const baseWidth = 150;
  const textLength = node.label.length;
  
  switch (node.type) {
    case 'table':
      return Math.max(baseWidth, textLength * 8);
    case 'join':
      return Math.max(180, textLength * 8);
    case 'subquery':
      return Math.max(200, textLength * 8);
    case 'cte':
      return Math.max(160, textLength * 8);
    case 'union':
      return 120;
    case 'output':
      return 100;
    default:
      return Math.max(baseWidth, textLength * 8);
  }
};

const getNodeHeight = (node: QueryNode): number => {
  const hasDetails = node.data && Object.keys(node.data).length > 0;
  const baseHeight = 60;
  
  return hasDetails ? baseHeight + 30 : baseHeight;
};

const formatNodeDetails = (node: QueryNode): string => {
  if (!node.data) return '';
  
  switch (node.type) {
    case 'table':
      return node.data.alias ? `Alias: ${node.data.alias}` : node.data.table || '';
    case 'join':
      return node.data.condition ? `ON ${node.data.condition.substring(0, 30)}...` : node.data.joinType || '';
    case 'filter':
      return node.data.condition ? `${node.data.condition.substring(0, 40)}...` : '';
    case 'select':
      return node.data.columns ? `${node.data.columns.substring(0, 40)}...` : '';
    case 'group':
      return node.data.columns ? `${node.data.columns}` : '';
    case 'order':
      return node.data.columns ? `${node.data.columns}` : '';
    case 'limit':
      return node.data.offset ? `${node.data.count} OFFSET ${node.data.offset}` : node.data.count || '';
    case 'aggregate':
      return node.data.functions ? node.data.functions.join(', ') : '';
    case 'union':
      return node.data.operation || '';
    case 'cte':
      return node.data.name || '';
    case 'subquery':
      return 'Nested Query';
    default:
      return '';
  }
};

const nodeColors: Record<string, string> = {
  table: '#4CAF50',
  join: '#2196F3',
  filter: '#FF9800',
  select: '#9C27B0',
  group: '#00BCD4',
  order: '#CDDC39',
  limit: '#FFC107',
  subquery: '#E91E63',
  union: '#9E9E9E',
  cte: '#795548',
  aggregate: '#FF5722',
  output: '#607D8B'
};

const getNodeStyle = (node: QueryNode) => ({
  background: nodeColors[node.type] || '#999',
  color: node.type === 'order' || node.type === 'limit' ? 'black' : 'white',
  border: `2px solid ${darkenColor(nodeColors[node.type] || '#999')}`,
  borderRadius: '8px',
  padding: '10px',
  minWidth: '120px',
  textAlign: 'center' as const,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  fontSize: '12px'
});

const darkenColor = (color: string): string => {
  // Simple color darkening - subtract from each RGB component
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const layoutEdges = (edges: QueryEdge[]): Edge[] => {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    animated: edge.animated || false,
    style: { 
      stroke: edge.animated ? '#ff6b6b' : '#555', 
      strokeWidth: edge.animated ? 3 : 2 
    },
    markerEnd: {
      type: 'arrowclosed' as any, // Type assertion to fix enum issue
      width: 20,
      height: 20,
      color: edge.animated ? '#ff6b6b' : '#555',
    },
    label: edge.label
  }));
};