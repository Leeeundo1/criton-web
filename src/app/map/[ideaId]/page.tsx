'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import 'reactflow/dist/style.css'; // Import reactflow styles
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { getQuestionsByModuleId } from '@lib/trainingModules'; // Import the helper
import toast from 'react-hot-toast'; // Import toast for notifications
import EditableNode from '../../../components/EditableNode'; // Use relative path
import CustomEdge from '../../../components/CustomEdge'; // Import CustomEdge
import ContextMenu from '../../../components/ContextMenu'; // Import ContextMenu

// Define type for answers
type Answers = { [index: number]: string };

// Default style definitions
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
    backgroundColor: '#6366f1', // Indigo background
    borderColor: '#818cf8', // Lighter indigo border
    textColor: '#ffffff',
    fontSize: '16px',
};

const questionNodeStyles = {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb', // Lighter grey border
    textColor: '#4b5563', // Darker grey text
    fontSize: '13px',
};

// Helper to calculate positions (remains the same)
const getNodePosition = (index: number, totalNodes: number, radius: number) => {
  const angle = (Math.PI * 2 / totalNodes) * index; // Use full circle for better distribution
  return {
    x: radius * Math.cos(angle - Math.PI / 2),
    y: radius * Math.sin(angle - Math.PI / 2), // Adjusted y calculation
  };
};

// Function to generate initial nodes and edges including style data
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
      data: {
        label: (
          <div className="p-4 rounded-xl shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-indigo-300">
            <p className="text-lg font-bold text-white">나의 아이디어</p>
            <p className="text-base mt-1 text-indigo-100 break-words">{ideaTitle}</p>
          </div>
        ),
        ...ideaNodeStyles, // Apply specific styles for the idea node
      },
      type: 'editableNode', 
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: { width: 260, background: 'transparent', border: 'none', textAlign: 'center' },
      zIndex: 10,
      draggable: true, // Make idea node draggable
    });

    questions.forEach((question, index) => {
      const nodeId = `q${index}`;
      const position = getNodePosition(index, questions.length, radius);
      const answerText = answers[index] || <span className="text-gray-400 italic">답변 없음</span>;
      const labelContent = `Q${index + 1}. ${question}\n\nA: ${answerText}`;

      initialNodes.push({
        id: nodeId,
        position: position,
        data: {
          label: (
            <div className="p-3 rounded-lg shadow-md bg-white border border-gray-200 w-60 hover:shadow-lg transition-shadow duration-200">
              <p className="text-[13px] font-semibold text-indigo-700 mb-2">Q{index + 1}. {question}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{answerText}</p>
            </div>
          ),
          ...questionNodeStyles, // Apply specific styles for question nodes
        },
        type: 'editableNode',
        sourcePosition: Position.Right, 
        targetPosition: Position.Left,
        style: { background: 'transparent', border: 'none', textAlign: 'left' },
        draggable: true, // Make question nodes draggable
      });

      initialEdges.push({
        id: `e-idea-${nodeId}`,
        source: 'idea',
        target: nodeId,
        type: 'customEdge', 
        animated: false, 
        data: {
          ...defaultEdgeStyles,
          strokeColor: '#a5b4fc', // Specific color for initial edges
        },
      });
    });

    return { initialNodes, initialEdges };
};

// Context Menu State Type
interface MenuState {
    isOpen: boolean;
    top?: number;
    left?: number;
    actions: Array<{ label: string; action: () => void }>;
}

// History State Type
interface HistoryEntry {
    nodes: Node[];
    edges: Edge[];
}

// Define some simple style options
const nodeBgColors = [
    { label: '흰색', value: '#ffffff' },
    { label: '하늘색', value: '#e0f2fe' }, // Light Blue
    { label: '연두색', value: '#dcfce7' }, // Light Green
    { label: '노란색', value: '#fef9c3' }, // Light Yellow
];
const nodeBorderColors = [
    { label: '회색', value: '#dddddd' },
    { label: '검정', value: '#333333' },
    { label: '파랑', value: '#60a5fa' }, // Blue
    { label: '초록', value: '#4ade80' }, // Green
];

// Define edge style options
const edgeStrokeColors = [
    { label: '회색', value: '#adb5bd' },
    { label: '검정', value: '#333333' },
    { label: '파랑', value: '#3b82f6' }, // Blue
    { label: '빨강', value: '#ef4444' }, // Red
];
const edgeStrokeWidths = [
    { label: '기본', value: 1.5 },
    { label: '굵게', value: 3 },
    { label: '얇게', value: 0.8 },
];

// Wrapper component to use useReactFlow hook
function FlowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]); // State for history
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Index for current history state
  const [isRestoring, setIsRestoring] = useState<boolean>(false); // Flag to prevent recording history during undo/redo
  const [ideaTitle, setIdeaTitle] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [moduleType, setModuleType] = useState<string | null>(null); // State for module type
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Saving state
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const ideaId = params.ideaId as string;
  const supabase = createClientComponentClient();
  const { project, setViewport } = useReactFlow(); // Get project function and setViewport
  const reactFlowWrapper = useRef<HTMLDivElement>(null); // Ref for wrapper div

  // State for Context Menu
  const [menu, setMenu] = useState<MenuState>({ isOpen: false, actions: [] });

  // Define custom node and edge types
  const nodeTypes: NodeTypes = { editableNode: EditableNode };
  const edgeTypes: EdgeTypes = { customEdge: CustomEdge }; // Register CustomEdge

  // --- History Management ---
  const recordHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    // Don't record if we are currently undoing/redoing
    if (isRestoring) return;

    const newHistoryEntry = { nodes: currentNodes, edges: currentEdges };

    // If we are not at the end of history, truncate the future
    const nextHistory = history.slice(0, historyIndex + 1);

    setHistory([...nextHistory, newHistoryEntry]);
    setHistoryIndex(nextHistory.length);
  }, [history, historyIndex, isRestoring]);

  // Function to set nodes/edges and record history
  const setNodesAndEdgesWithHistory = useCallback((newNodes: Node[] | ((prevNodes: Node[]) => Node[]), newEdges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => {
    const resolvedNodes = typeof newNodes === 'function' ? newNodes(nodes) : newNodes;
    const resolvedEdges = typeof newEdges === 'function' ? newEdges(edges) : newEdges;

    // Record the state *before* the change
    recordHistory(nodes, edges);

    setNodes(resolvedNodes);
    setEdges(resolvedEdges);
  }, [nodes, edges, recordHistory]);

  // Fetch data including map_data
  useEffect(() => {
    if (!ideaId) {
        setError("아이디어 ID를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let fetchedMapData = null;
      let fetchedIdeaTitle = null;
      let fetchedModuleType = null;
      let fetchedAnswers = {};
      let initialNodes: Node[] = [];
      let initialEdges: Edge[] = [];

      try {
          // Fetch Idea Title, Module Type, and Map Data
          const { data: ideaData, error: ideaError } = await supabase
            .from('ideas')
            .select('title, module_type, map_data') // Select map_data
            .eq('id', ideaId)
            .single();

          if (ideaError) throw new Error(`아이디어 정보 로딩 오류: ${ideaError.message}`);
          if (!ideaData) throw new Error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');
          
          fetchedIdeaTitle = ideaData.title || '제목 없음';
          fetchedModuleType = ideaData.module_type;
          fetchedMapData = ideaData.map_data; // Store fetched map_data
          setIdeaTitle(fetchedIdeaTitle); // Set title state

          // Fetch Training Answers (needed for initial generation if map_data is null)
          const { data: answersData, error: answersError } = await supabase
            .from('training_answers')
            .select('answers_data')
            .eq('idea_id', ideaId)
            .single();

          if (answersError && answersError.code !== 'PGRST116') {
            throw new Error(`답변 데이터 로딩 오류: ${answersError.message}`);
          }
          fetchedAnswers = (answersData?.answers_data as Answers) || {};

          // Initialize nodes and edges
          if (fetchedMapData && typeof fetchedMapData === 'object' && fetchedMapData.nodes && fetchedMapData.edges) {
            // Load from saved map_data
            console.log("Loading map from saved data...");
            initialNodes = (fetchedMapData.nodes as Node[]).map(n => ({...n, type: n.type || 'editableNode'}));
            initialEdges = (fetchedMapData.edges as Edge[]).map(e => ({...e, type: e.type || 'customEdge'}));
          } else {
            // Generate initial layout if no saved data
             console.log("Generating initial map layout...");
            if (fetchedIdeaTitle && fetchedModuleType) {
                 const layout = generateInitialLayout(fetchedIdeaTitle, fetchedModuleType, fetchedAnswers);
                 initialNodes = layout.initialNodes;
                 initialEdges = layout.initialEdges;
            } else {
                throw new Error('아이디어 제목 또는 모듈 타입을 가져올 수 없어 초기 맵을 생성할 수 없습니다.');
            }
          }

          // Set initial state without recording history
          setNodes(initialNodes);
          setEdges(initialEdges);

          // Initialize history with the first state
          const initialHistoryEntry = { nodes: initialNodes, edges: initialEdges };
          setHistory([initialHistoryEntry]);
          setHistoryIndex(0);

      } catch (err: any) {
          console.error('Error fetching map data:', err.message);
          setError(err.message);
          toast.error(`맵 데이터 로딩 실패: ${err.message}`);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [ideaId, supabase]);

  // --- Modified State Handlers to use History ---

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodes);
      // Only record history for significant changes (drag stop, remove)
      const shouldRecord = changes.some(c => c.type === 'remove' || (c.type === 'position' && c.dragging === false));
      if (shouldRecord && !isRestoring) {
           recordHistory(nodes, edges); // Record state *before* applying changes
      }
      setNodes(nextNodes);
      // Do not update edges here unless a node removal necessitates it (handled in deleteNode)
    },
    [nodes, edges, recordHistory, isRestoring] // Added dependencies
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      const shouldRecord = changes.some(c => c.type === 'remove');
      if (shouldRecord && !isRestoring) {
          recordHistory(nodes, edges); // Record state *before* applying changes
      }
      setEdges(nextEdges);
      // Do not update nodes here
    },
    [nodes, edges, recordHistory, isRestoring] // Added dependencies
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
        // Use history setter
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
      // Use history setter
      setNodesAndEdgesWithHistory(nds => nds, eds => addEdge(newEdge, eds));
    },
    [setNodesAndEdgesWithHistory]
  );

  // Define closeMenu early as it's used in updateNodeStyle
  const closeMenu = useCallback(() => {
    setMenu({ isOpen: false, actions: [] });
  }, [setMenu]);

  // --- Function to Update Node Style ---
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

  // --- Function to Update Edge Style ---
  const updateEdgeStyle = useCallback((edgeId: string, styleProp: string, value: any) => {
      setNodesAndEdgesWithHistory(
          (nds) => nds, // No change to nodes
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

  // --- Context Menu Logic (Modified Delete and Context Handlers) ---

  const deleteNode = useCallback((nodeId: string) => {
    // Use history setter
    setNodesAndEdgesWithHistory(
        nds => nds.filter((node) => node.id !== nodeId),
        eds => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  const deleteEdge = useCallback((edgeId: string) => {
    // Use history setter
    setNodesAndEdgesWithHistory(
        nds => nds,
        eds => eds.filter((edge) => edge.id !== edgeId)
    );
    closeMenu();
  }, [setNodesAndEdgesWithHistory, closeMenu]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;

      const nodeActions: Array<{ label: string; action: () => void }> = [];

      // Style Actions
      nodeBgColors.forEach(color => {
          nodeActions.push({
              label: `배경: ${color.label}`,
              action: () => updateNodeStyle(node.id, 'backgroundColor', color.value)
          });
      });
      nodeBorderColors.forEach(color => {
          nodeActions.push({
              label: `테두리: ${color.label}`,
              action: () => updateNodeStyle(node.id, 'borderColor', color.value)
          });
      });
      if(nodeBgColors.length > 0 || nodeBorderColors.length > 0) {
         nodeActions.push({ label: '-----', action: () => {} });
      }

      // Navigation/Delete Actions
      if (node.id === 'idea') {
          nodeActions.push({ label: '아이디어 제목 수정', action: () => router.push(`/idea/${ideaId}/edit`) });
      } else if (node.id.startsWith('q')) {
          nodeActions.push({ label: '관련 질문 답변 보기/수정', action: () => router.push(`/training/${ideaId}`) });
      }
      const isDeletable = node.id !== 'idea';
      if (isDeletable) {
        nodeActions.push({ label: '노드 삭제', action: () => deleteNode(node.id) });
      }

      // Open Menu
      if (nodeActions.length > 0) {
        const finalActions = nodeActions.filter((action, index, arr) => {
            if (action.label === '-----') {
                return index < arr.length - 1 && arr[index+1].label !== '-----';
            }
            return true;
        });
        setMenu({
          isOpen: true,
          top: event.clientY - pane.top,
          left: event.clientX - pane.left,
          actions: finalActions,
        });
      } else {
        closeMenu();
      }
    },
    [deleteNode, updateNodeStyle, setMenu, closeMenu, router, ideaId]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const pane = reactFlowWrapper.current?.getBoundingClientRect();
      if (!pane) return;

      const edgeActions: Array<{ label: string; action: () => void }> = [];

      // --- Add Style Actions --- //
      edgeStrokeColors.forEach(color => {
          edgeActions.push({
              label: `선 색상: ${color.label}`,
              action: () => updateEdgeStyle(edge.id, 'strokeColor', color.value)
          });
      });
      edgeStrokeWidths.forEach(width => {
          edgeActions.push({
              label: `선 두께: ${width.label}`,
              action: () => updateEdgeStyle(edge.id, 'strokeWidth', width.value)
          });
      });
      if (edgeStrokeColors.length > 0 || edgeStrokeWidths.length > 0) {
           edgeActions.push({ label: '-----', action: () => {} });
      }
      // --- End Style Actions --- //

      // Action to delete the edge
      edgeActions.push({ label: '연결선 삭제', action: () => deleteEdge(edge.id) });

      // Open Menu (filter separator if needed)
      const finalActions = edgeActions.filter((action, index, arr) => {
         if (action.label === '-----') {
             return index < arr.length - 1 && arr[index+1].label !== '-----';
         }
         return true;
      });

      setMenu({
        isOpen: true,
        top: event.clientY - pane.top,
        left: event.clientX - pane.left,
        actions: finalActions,
      });
    },
    [deleteEdge, updateEdgeStyle, setMenu, closeMenu] // Added updateEdgeStyle
  );

  // Close menu on pane click or context menu
  const onPaneClick = useCallback(() => closeMenu(), [closeMenu]);
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
        event.preventDefault(); // Prevent browser default
        closeMenu();
        // Could potentially open a different context menu for the pane here
    },
    [closeMenu]
  );

  // --- Undo/Redo Logic ---
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsRestoring(true); // Set flag before state change
      const previousIndex = historyIndex - 1;
      const previousState = history[previousIndex];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(previousIndex);
      // Reset flag after state update (using timeout to ensure it happens after render)
      setTimeout(() => setIsRestoring(false), 0);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsRestoring(true); // Set flag before state change
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(nextIndex);
      // Reset flag after state update
       setTimeout(() => setIsRestoring(false), 0);
    }
  }, [history, historyIndex]);

  // Save Map Function (remains the same)
  const saveMapData = async () => {
      setIsSaving(true);
      const currentMapData = { nodes, edges }; // Capture current state
      const toastId = toast.loading('마인드맵 저장 중...');

      try {
          const { error: updateError } = await supabase
              .from('ideas')
              .update({ map_data: currentMapData })
              .eq('id', ideaId);

          if (updateError) throw updateError;

          toast.success('마인드맵이 저장되었습니다!', { id: toastId });
      } catch (err: any) {
          console.error("Error saving map data:", err);
          toast.error(`마인드맵 저장 실패: ${err.message}`, { id: toastId });
      }
      setIsSaving(false);
  };

  if (isLoading) {
      return <div className="flex justify-center items-center h-[calc(100vh-57px)]">마인드맵 로딩 중...</div>;
  }

  if (error) {
      return (
          <div className="flex flex-col justify-center items-center h-screen text-red-500 p-4">
              <p className="bg-red-100 p-4 rounded-md mb-4">오류: {error}</p>
              <Link href="/dashboard" className="text-indigo-600 hover:underline">대시보드로 돌아가기</Link>
          </div>
      );
  }
  
  // Handle case where initial generation might fail but data loading succeeded
  if (!isLoading && nodes.length === 0 && ideaTitle) {
       return (
          <div className="flex flex-col justify-center items-center h-screen text-orange-600 p-4">
              <p className="bg-orange-100 p-4 rounded-md mb-4">마인드맵을 생성/로드할 수 없습니다. (데이터 확인 필요)</p>
              <Link href={`/training/${ideaId}`} className="text-indigo-600 hover:underline mb-2">아이디어 다시 작성하기</Link>
              <Link href="/dashboard" className="text-gray-600 hover:underline">대시보드로 돌아가기</Link>
          </div>
      );
  }

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      {/* Header with Undo/Redo Buttons */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-3 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
           {/* Undo Button */} 
           <button
                onClick={undo}
                disabled={historyIndex <= 0}
                title="실행 취소 (Ctrl+Z)"
                className={`p-2 rounded-md text-sm font-medium ${historyIndex <= 0 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm'}`}
            >
                ↩️
            </button>
             {/* Redo Button */} 
            <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="다시 실행 (Ctrl+Y)"
                className={`p-2 rounded-md text-sm font-medium ${historyIndex >= history.length - 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm'}`}
            >
                 ↪️
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate pl-2">
              {ideaTitle ? `${ideaTitle} - 마인드맵` : "아이디어 마인드맵"}
            </h1>
        </div>
        {/* Right side buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0 pr-2">
          <button
            onClick={saveMapData}
            disabled={isSaving}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ${isSaving ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            {isSaving ? '저장 중...' : '맵 저장'}
          </button>
          <Link href={`/training/${ideaId}`} title="다시 작성하기" className="p-2 text-sm font-medium text-indigo-600 bg-white rounded-md shadow hover:bg-gray-50">✏️</Link>
          <Link href={`/summary/${ideaId}`} title="요약 보기" className="p-2 text-sm font-medium text-blue-600 bg-white rounded-md shadow hover:bg-gray-50">📄</Link>
          <Link href="/dashboard" title="목록으로" className="p-2 text-sm font-medium text-gray-600 bg-white rounded-md shadow hover:bg-gray-50">📊</Link>
        </div>
      </div>
      
      {/* React Flow Area */}
      <div className="flex-grow" style={{ height: 'calc(100vh - 57px)' }}> {/* Adjusted height based on header */}
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes} // Pass the custom node types
            edgeTypes={edgeTypes} // Pass the custom edge types
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onDoubleClick={onDoubleClick}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            fitView
            fitViewOptions={{ padding: 0.2 }} // Add padding on fitView
            className="bg-gradient-to-br from-indigo-50 via-white to-purple-50"
            minZoom={0.1} // Allow zooming out further
          >
            <Controls showInteractive={true}/>
            <Background gap={24} color="#e0e0e0"/>
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Render Context Menu */}
      {menu.isOpen && menu.top !== undefined && menu.left !== undefined && (
        <ContextMenu
          top={menu.top}
          left={menu.left}
          actions={menu.actions}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

// Main page component that wraps FlowEditor with Provider
export default function MapPage() {
    const params = useParams();
    const ideaId = params.ideaId as string;
    // You might fetch the idea title here for the outer header if needed
    // but the main logic is now inside FlowEditor

    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50">
          {/* Simplified Header - Title might be fetched in FlowEditor now */}
           <div className="flex justify-between items-center p-3 bg-white shadow-sm border-b border-gray-200">
             <h1 className="text-lg font-semibold text-gray-800 truncate pl-2">
                {/* Displaying title here might require separate fetch or passing props */} 
                아이디어 마인드맵
             </h1>
             {/* Placeholder for buttons if needed outside FlowEditor */} 
           </div>
          
          {/* React Flow Provider wrapping the editor */}
          <div className="flex-grow" style={{ height: 'calc(100vh - 57px)' }}>
              <ReactFlowProvider>
                  <FlowEditor />
              </ReactFlowProvider>
          </div>
        </div>
    );
} 