'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Controls,
  Background,
  Node,
  Edge,
  Position,
} from 'reactflow';

// Import reactflow styles - Make sure this is imported globally or here
// import 'reactflow/dist/style.css'; 

import { useIdeaStore } from '@/lib/store/ideaStore';
import { useTrainingStore } from '@/lib/store/trainingStore';

// Use the same questions array
const questions = [
  "당신의 아이디어는 어떤 문제를 해결하나요?",
  "누구를 위한 아이디어인가요?",
  "기존 해결 방식은 무엇이 있었고, 어떤 점이 부족했나요?",
  "당신의 아이디어는 어떻게 다르게 해결하나요?",
  "실패한다면 그 이유는 무엇일까요?"
];

// Helper to calculate positions in a semi-circle
const getNodePosition = (index: number, totalNodes: number, radius: number) => {
  const angle = Math.PI / (totalNodes + 1) * (index + 1); // Spread nodes in a semi-circle (top half)
  return {
    x: radius * Math.cos(angle - Math.PI / 2), // Adjust angle to start from top-center
    y: -radius * Math.sin(angle - Math.PI / 2), // Y is negative because react-flow y-axis is downwards
  };
};

export default function MapPage() {
  const idea = useIdeaStore((state) => state.idea);
  const answers = useTrainingStore((state) => state.answers);
  const router = useRouter();

  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const radius = 300; // Radius for positioning question nodes

    // Center Node (Idea)
    initialNodes.push({
      id: 'idea',
      position: { x: 0, y: 0 },
      data: {
        label: (
          <div className="p-3 rounded-lg shadow-lg bg-indigo-100 border-2 border-indigo-300">
            <p className="text-lg font-bold text-indigo-800">나의 아이디어</p>
            <p className="text-base mt-1 text-indigo-700">{idea || '아이디어를 먼저 입력해주세요'}</p>
          </div>
        ),
      },
      type: 'default', // Use default or create custom nodes
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      style: { width: 250, background: 'transparent', border: 'none' }, // Style wrapper if needed
    });

    // Question/Answer Nodes
    questions.forEach((question, index) => {
      const nodeId = `q${index}`;
      const position = getNodePosition(index, questions.length, radius);
      const answer = answers[index] || '답변 없음';

      initialNodes.push({
        id: nodeId,
        position: position,
        data: {
          label: (
            <div className="p-4 rounded-lg shadow-md bg-white border border-gray-200 w-64">
              <p className="text-sm font-semibold text-gray-700 mb-2">{index + 1}. {question}</p>
              <p className="text-base text-gray-600 whitespace-pre-wrap">{answer}</p>
            </div>
          ),
        },
        type: 'default',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: { background: 'transparent', border: 'none' }, // Make node wrapper transparent
      });

      // Edge from Idea to Question
      initialEdges.push({
        id: `e-idea-${nodeId}`,
        source: 'idea',
        target: nodeId,
        type: 'smoothstep', // Or bezier, step
        animated: true,
      });
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [idea, answers]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <h1 className="text-2xl font-bold text-center text-gray-800 p-4 bg-white shadow-sm">
        나의 아이디어 마인드맵
      </h1>
      <div className="flex-grow" style={{ height: 'calc(100% - 120px)' }}> {/* Adjust height calculation based on header/footer */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          className="bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
      {/* Navigation Buttons Footer */}
      <div className="flex justify-center space-x-4 p-4 bg-white shadow-sm border-t border-gray-200">
          <button
            onClick={() => handleNavigate('/training')}
            className="px-5 py-2.5 text-base font-medium text-center text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:ring-4 focus:ring-indigo-300"
          >
            다시 작성하기
          </button>
          <button
            onClick={() => handleNavigate('/summary')}
            className="px-5 py-2.5 text-base font-medium text-center text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
          >
            요약 보기
          </button>
      </div>
    </div>
  );
} 