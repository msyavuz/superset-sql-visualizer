import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MiniMap,
  MarkerType,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { parseQueryToFlow, QueryNode, QueryEdge } from '../utils/sqlParser';
import { layoutNodes, layoutEdges } from '../utils/layoutEngine';

interface QueryFlowDiagramProps {
  sql: string;
}

const nodeColors: Record<string, string> = {
  table: '#4CAF50',
  join: '#2196F3',
  filter: '#FF9800',
  select: '#9C27B0',
  group: '#00BCD4',
  order: '#CDDC39',
  limit: '#FFC107',
  subquery: '#E91E63'
};

const QueryFlowDiagram: React.FC<QueryFlowDiagramProps> = ({ sql }) => {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);

  const generateFlow = React.useCallback((sql: string) => {
    if (!sql || sql.trim() === '') {
      setNodes([{
        id: 'empty',
        position: { x: 250, y: 250 },
        data: { label: 'Enter a SQL query to visualize' },
        style: {
          background: '#f0f0f0',
          border: '1px dashed #999',
          borderRadius: '8px',
          padding: '10px'
        }
      }]);
      setEdges([]);
      return;
    }

    const flow = parseQueryToFlow(sql);
    
    // Use automatic layout engine
    const flowNodes = layoutNodes(flow.nodes, flow.edges).map(node => ({
      ...node,
      data: {
        ...node.data,
        label: (
          <div style={{ fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
            <div>{node.data.label}</div>
            {node.data.details && (
              <div style={{ 
                fontSize: '11px', 
                marginTop: '4px', 
                opacity: 0.8,
                fontWeight: 'normal',
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}>
                {node.data.details}
              </div>
            )}
          </div>
        )
      }
    }));
    const flowEdges = layoutEdges(flow.edges);

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, []);

  React.useEffect(() => {
    generateFlow(sql);
  }, [sql, generateFlow]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div style={{ width: '100%', height: '600px', background: '#fafafa' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const type = node.style?.background || '#999';
            return type as string;
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default QueryFlowDiagram;