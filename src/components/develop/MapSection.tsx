'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import ReactFlow, {
    Controls,
    Background,
    Node,
    Edge,
    Position,
    applyNodeChanges,
    applyEdgeChanges,
    OnNodesChange,
    OnEdgesChange,
    ReactFlowProvider,
    useReactFlow,
    addEdge,
    Connection,
    NodeTypes,
    EdgeTypes,
    type ReactFlowInstance,
    NodeChange,
    EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { getQuestionsByModuleId, getModuleById } from '@lib/trainingModules';
import toast from 'react-hot-toast';
// Adjust import paths for components relative to the new location
import EditableNode from '../EditableNode';
import CustomEdge from '../CustomEdge';
import ContextMenu from '../ContextMenu';

// Define type for answers
type Answers = { [index: number]: string };

// Default style definitions (copied from old map page)
const defaultNodeStyles = {
    backgroundColor: '#ffffff',
    borderColor: '#dddddd',
    textColor: '#333333',
    fontSize: '14px',
};
const defaultEdgeStyles = {
    strokeColor: '#adb5bd', // A slightly different default grey
    strokeWidth: 1.5,
};
const ideaNodeStyles = {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
    textColor: '#ffffff',
    fontSize: '16px',
};
const questionNodeStyles = {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#4b5563',
    fontSize: '13px',
};

// Node Background color options (copied)
const nodeBgColors = [
    { label: '흰색', value: '#ffffff' },
    { label: '하늘색', value: '#e0f2fe' },
    { label: '연두색', value: '#dcfce7' },
    { label: '노란색', value: '#fef9c3' },
];
// Node Border color options (copied)
const nodeBorderColors = [
    { label: '회색', value: '#dddddd' },
    { label: '검정', value: '#333333' },
    { label: '파랑', value: '#60a5fa' },
    { label: '초록', value: '#4ade80' },
];
// Edge Stroke color options (copied)
const edgeStrokeColors = [
    { label: '회색', value: '#adb5bd' },
    { label: '검정', value: '#333333' },
    { label: '파랑', value: '#3b82f6' },
    { label: '빨강', value: '#ef4444' },
];
// Edge Stroke width options (copied)
const edgeStrokeWidths = [
    { label: '기본', value: 1.5 },
    { label: '굵게', value: 3 },
    { label: '얇게', value: 0.8 },
];

// Helper to calculate positions (copied)
const getNodePosition = (index: number, totalNodes: number, radius: number) => {
  const angle = (Math.PI * 2 / totalNodes) * index;
  return {
    x: radius * Math.cos(angle - Math.PI / 2),
    y: radius * Math.sin(angle - Math.PI / 2),
  };
};

// Generate Initial Layout (copied and adapted)
const generateInitialLayout = (ideaTitle: string, moduleType: string, answers: Answers): { initialNodes: Node[], initialEdges: Edge[] } => {
    const questions = getQuestionsByModuleId(moduleType);
    if (questions.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const radius = questions.length > 6 ? 350 : 300;

    initialNodes.push({
      id: 'idea',
      position: { x: 0, y: -50 },
      data: { label: `아이디어: ${ideaTitle}`, ...ideaNodeStyles },
      type: 'editableNode',
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: true,
    });

    questions.forEach((question, index) => {
      const nodeId = `q${index}`;
      const position = getNodePosition(index, questions.length, radius);
      const answerText = answers[index] || '답변 없음';
      const labelContent = `Q${index + 1}. ${question}\n\nA: ${answerText}`;
      initialNodes.push({
        id: nodeId,
        position: position,
        data: { label: labelContent, ...questionNodeStyles },
        type: 'editableNode',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: true,
      });
      initialEdges.push({
        id: `e-idea-${nodeId}`,
        source: 'idea',
        target: nodeId,
        type: 'customEdge',
        animated: false,
        data: { ...defaultEdgeStyles, strokeColor: '#a5b4fc' },
      });
    });
    return { initialNodes, initialEdges };
};

// Context Menu State Type (copied)
interface MenuState {
    isOpen: boolean;
    top?: number;
    left?: number;
    actions: Array<{ label: string; action: () => void }>;
}

// History State Type (copied)
interface HistoryEntry {
    nodes: Node[];
    edges: Edge[];
}

// --- Main Map Section Component --- Interface Props changed
interface MapSectionProps {
  ideaId: string;
}

const MapSectionContent: React.FC<MapSectionProps> = ({ ideaId }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [ideaTitle, setIdeaTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Use router for navigation actions
  const supabase = createClientComponentClient();
  const { project } = useReactFlow(); // removed setViewport for now
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState>({ isOpen: false, actions: [] });

  const nodeTypes: NodeTypes = { editableNode: EditableNode };
  const edgeTypes: EdgeTypes = { customEdge: CustomEdge };

  // --- History Management (copied) ---
  const recordHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (isRestoring) return;
    const newHistoryEntry = { nodes: currentNodes, edges: currentEdges };
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newHistoryEntry]);
    setHistoryIndex(nextHistory.length);
  }, [history, historyIndex, isRestoring]);

  const setNodesAndEdgesWithHistory = useCallback((newNodes: Node[] | ((prevNodes: Node[]) => Node[]), newEdges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => {
    const resolvedNodes = typeof newNodes === 'function' ? newNodes(nodes) : newNodes;
    const resolvedEdges = typeof newEdges === 'function' ? newEdges(edges) : newEdges;
    recordHistory(nodes, edges);
    setNodes(resolvedNodes);
    setEdges(resolvedEdges);
  }, [nodes, edges, recordHistory]);

  // Define closeMenu early (copied)
  const closeMenu = useCallback(() => {
    setMenu({ isOpen: false, actions: [] });
  }, [setMenu]);

  // --- Style Update Functions (copied) ---
  const updateNodeStyle = useCallback((nodeId: string, styleProp: string, value: any) => {
    setNodesAndEdgesWithHistory(
      (nds) => nds.map((node) => {
        if (node.id === nodeId) {
          const newData = { ...node.data, [styleProp]: value };
          return { ...node, data: newData };
        }
        return node;
      }),
      (eds) => eds
    );
    closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  const updateEdgeStyle = useCallback((edgeId: string, styleProp: string, value: any) => {
      setNodesAndEdgesWithHistory(
          (nds) => nds,
          (eds) => eds.map((edge) => {
              if (edge.id === edgeId) {
                  const newData = { ...edge.data, [styleProp]: value };
                  return { ...edge, data: newData };
              }
              return edge;
          })
      );
      closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  // Fetch data (copied and adapted)
  useEffect(() => {
    if (!ideaId) {
      setError("아이디어 ID가 필요합니다.");
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let initialNodes: Node[] = [];
      let initialEdges: Edge[] = [];

      try {
          const { data: ideaData, error: ideaError } = await supabase
            .from('ideas')
            .select('title, module_type, map_data')
            .eq('id', ideaId)
            .single();
          if (ideaError) throw new Error(`아이디어 정보 로딩 오류: ${ideaError.message}`);
          if (!ideaData) throw new Error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');

          setIdeaTitle(ideaData.title || '제목 없음');

          if (ideaData.map_data && typeof ideaData.map_data === 'object' && ideaData.map_data.nodes && ideaData.map_data.edges) {
            console.log("Loading map from saved data...");
            initialNodes = (ideaData.map_data.nodes as Node[]).map(n => ({...n, type: n.type || 'editableNode'}));
            initialEdges = (ideaData.map_data.edges as Edge[]).map(e => ({...e, type: e.type || 'customEdge'}));
          } else {
             console.log("Generating initial map layout...");
             const { data: answersData, error: answersError } = await supabase
               .from('training_answers')
               .select('answers_data')
               .eq('idea_id', ideaId)
               .single();
             if (answersError && answersError.code !== 'PGRST116') {
               throw new Error(`답변 데이터 로딩 오류: ${answersError.message}`);
             }
             const fetchedAnswers = (answersData?.answers_data as Answers) || {};
             if (ideaData.title && ideaData.module_type) {
                 const layout = generateInitialLayout(ideaData.title, ideaData.module_type, fetchedAnswers);
                 initialNodes = layout.initialNodes;
                 initialEdges = layout.initialEdges;
             } else {
                throw new Error('아이디어 제목 또는 모듈 타입을 가져올 수 없어 초기 맵을 생성할 수 없습니다.');
             }
          }

          setNodes(initialNodes);
          setEdges(initialEdges);
          const initialHistoryEntry = { nodes: initialNodes, edges: initialEdges };
          setHistory([initialHistoryEntry]);
          setHistoryIndex(0);

      } catch (err: any) {
          console.error('Error fetching map section data:', err.message);
          setError(`맵 데이터 로딩 실패: ${err.message}`);
          toast.error(`맵 데이터 로딩 실패: ${err.message}`);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [ideaId, supabase]); // Removed other dependencies, fetch depends on ideaId

  // --- React Flow Handlers (copied and adapted) ---
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodes);
      const shouldRecord = changes.some(c => c.type === 'remove' || (c.type === 'position' && c.dragging === false));
      if (shouldRecord && !isRestoring) {
           recordHistory(nodes, edges);
      }
      setNodes(nextNodes);
    },
    [nodes, edges, recordHistory, isRestoring]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      const shouldRecord = changes.some(c => c.type === 'remove');
      if (shouldRecord && !isRestoring) {
          recordHistory(nodes, edges);
      }
      setEdges(nextEdges);
    },
    [nodes, edges, recordHistory, isRestoring]
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
      if (targetIsPane) {
        const position = project({ x: event.clientX, y: event.clientY });
        const newNodeId = crypto.randomUUID();
        const newNode: Node = {
          id: newNodeId,
          position,
          data: { label: '새 노드', ...defaultNodeStyles },
          type: 'editableNode',
          draggable: true,
        };
        setNodesAndEdgesWithHistory(nds => nds.concat(newNode), eds => eds);
      }
    },
    [project, setNodesAndEdgesWithHistory]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: 'customEdge',
        animated: false,
        data: { ...defaultEdgeStyles }
      };
      setNodesAndEdgesWithHistory(nds => nds, eds => addEdge(newEdge, eds));
    },
    [setNodesAndEdgesWithHistory]
  );

  // Delete handlers (copied)
  const deleteNode = useCallback((nodeId: string) => {
    setNodesAndEdgesWithHistory(
        nds => nds.filter((node) => node.id !== nodeId),
        eds => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  const deleteEdge = useCallback((edgeId: string) => {
    setNodesAndEdgesWithHistory(
        nds => nds,
        eds => eds.filter((edge) => edge.id !== edgeId)
    );
    closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  // Context Menu handlers (copied and adapted)
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;
      const nodeActions: Array<{ label: string; action: () => void }> = [];
      nodeBgColors.forEach(color => nodeActions.push({ label: `배경: ${color.label}`, action: () => updateNodeStyle(node.id, 'backgroundColor', color.value) }));
      nodeBorderColors.forEach(color => nodeActions.push({ label: `테두리: ${color.label}`, action: () => updateNodeStyle(node.id, 'borderColor', color.value) }));
      if(nodeBgColors.length > 0 || nodeBorderColors.length > 0) nodeActions.push({ label: '-----', action: () => {} });
      if (node.id === 'idea') nodeActions.push({ label: '아이디어 제목 수정', action: () => router.push(`/idea/${ideaId}/edit`) });
      else if (node.id.startsWith('q')) nodeActions.push({ label: '관련 질문 답변 보기/수정', action: () => router.push(`/idea/${ideaId}/develop?section=training`) }); // Link to training section
      const isDeletable = node.id !== 'idea';
      if (isDeletable) nodeActions.push({ label: '노드 삭제', action: () => deleteNode(node.id) });
      const finalActions = nodeActions.filter((a, i, arr) => !(a.label === '-----' && (i === arr.length - 1 || arr[i+1].label === '-----')));
      if (finalActions.length > 0) setMenu({ isOpen: true, top: event.clientY - pane.top, left: event.clientX - pane.left, actions: finalActions });
      else closeMenu();
    },
    [deleteNode, updateNodeStyle, setMenu, closeMenu, router, ideaId] // Added router, ideaId
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;
      const edgeActions: Array<{ label: string; action: () => void }> = [];
      edgeStrokeColors.forEach(color => edgeActions.push({ label: `선 색상: ${color.label}`, action: () => updateEdgeStyle(edge.id, 'strokeColor', color.value) }));
      edgeStrokeWidths.forEach(width => edgeActions.push({ label: `선 두께: ${width.label}`, action: () => updateEdgeStyle(edge.id, 'strokeWidth', width.value) }));
      if (edgeStrokeColors.length > 0 || edgeStrokeWidths.length > 0) edgeActions.push({ label: '-----', action: () => {} });
      edgeActions.push({ label: '연결선 삭제', action: () => deleteEdge(edge.id) });
      const finalActions = edgeActions.filter((a, i, arr) => !(a.label === '-----' && (i === arr.length - 1 || arr[i+1].label === '-----')));
      setMenu({ isOpen: true, top: event.clientY - pane.top, left: event.clientX - pane.left, actions: finalActions });
    },
    [deleteEdge, updateEdgeStyle, setMenu, closeMenu]
  );

  const onPaneClick = useCallback(() => closeMenu(), [closeMenu]);
  const onPaneContextMenu = useCallback((event: React.MouseEvent) => { event.preventDefault(); closeMenu(); }, [closeMenu]);

  // Undo/Redo Logic (copied)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsRestoring(true);
      const previousIndex = historyIndex - 1;
      const previousState = history[previousIndex];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(previousIndex);
      setTimeout(() => setIsRestoring(false), 0);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsRestoring(true);
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(nextIndex);
      setTimeout(() => setIsRestoring(false), 0);
    }
  }, [history, historyIndex]);

  // Save Map Function (copied)
  const saveMapData = async () => {
      setIsSaving(true);
      const mapDataToSave = { nodes: nodes.map(n => ({ ...n, type: n.type || 'editableNode' })), edges: edges.map(e => ({ ...e, type: e.type || 'customEdge' })) };
      const toastId = toast.loading('마인드맵 저장 중...');
      try {
          const { error: updateError } = await supabase.from('ideas').update({ map_data: mapDataToSave }).eq('id', ideaId);
          if (updateError) throw updateError;
          toast.success('마인드맵이 저장되었습니다!', { id: toastId });
      } catch (err: any) {
          console.error("Error saving map data:", err);
          toast.error(`마인드맵 저장 실패: ${err.message}`, { id: toastId });
      }
      setIsSaving(false);
  };

  // --- UI Rendering ---
  if (isLoading) {
      return <div className="p-4 text-center h-full flex items-center justify-center">마인드맵 로딩 중...</div>;
  }
  if (error) {
      return <div className="p-4 text-center text-red-500 h-full flex items-center justify-center">오류: {error}</div>;
  }
  if (!isLoading && nodes.length === 0 && ideaTitle) {
       return (
          <div className="p-4 text-center text-orange-600 h-full flex flex-col items-center justify-center">
              <p className="bg-orange-100 p-4 rounded-md mb-4">마인드맵을 생성/로드할 수 없습니다. (데이터 확인 필요)</p>
              <Link href={`/idea/${ideaId}/develop?section=training`} className="text-indigo-600 hover:underline mb-2">핵심 질문 답변하기</Link>
          </div>
      );
  }

  return (
    // Removed outer div and header from original FlowEditor
    // Changed h-full to flex-grow
    <div className="w-full relative border rounded-lg overflow-hidden flex-grow" ref={reactFlowWrapper}> {/* Changed h-full to flex-grow */}
        {/* Buttons moved inside the wrapper */}
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-2">
             <button onClick={undo} disabled={historyIndex <= 0} title="실행 취소" className={`p-1.5 rounded bg-white shadow border text-xs ${historyIndex <= 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}>↩️</button>
             <button onClick={redo} disabled={historyIndex >= history.length - 1} title="다시 실행" className={`p-1.5 rounded bg-white shadow border text-xs ${historyIndex >= history.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}>↪️</button>
             <button onClick={saveMapData} disabled={isSaving} className={`px-2 py-1 rounded bg-green-100 text-green-700 shadow border border-green-200 text-xs font-medium hover:bg-green-200 ${isSaving ? 'cursor-not-allowed opacity-70' : ''}`}>{isSaving ? '저장중...' : '맵 저장'}</button>
        </div>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDoubleClick={onDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 via-white to-purple-50"
            minZoom={0.1}
        >
            <Controls showInteractive={true}/>
            <Background gap={24} color="#e0e0e0"/>
        </ReactFlow>

        {menu.isOpen && menu.top !== undefined && menu.left !== undefined && (
            <ContextMenu top={menu.top} left={menu.left} actions={menu.actions} onClose={closeMenu} />
        )}
    </div>
  );
}

// Wrapper component needed for ReactFlowProvider
const MapSection: React.FC<MapSectionProps> = ({ ideaId }) => {
    return (
        <ReactFlowProvider>
            <MapSectionContent ideaId={ideaId} />
        </ReactFlowProvider>
    );
};

export default MapSection; 