export interface TrainingModule {
  id: string; // Unique identifier (e.g., 'basic', 'scamper')
  name: string; // Display name (e.g., '기본 질문', 'SCAMPER')
  description: string; // Brief description of the module
  questions: string[]; // Array of questions for this module
}

export const trainingModules: TrainingModule[] = [
  {
    id: 'basic',
    name: '기본 질문',
    description: '아이디어의 핵심 요소를 파악하는 기본적인 질문 세트입니다.',
    questions: [
      "당신의 아이디어는 어떤 문제를 해결하나요?",
      "누구를 위한 아이디어인가요?",
      "기존 해결 방식은 무엇이 있었고, 어떤 점이 부족했나요?",
      "당신의 아이디어는 어떻게 다르게 해결하나요?",
      "실패한다면 그 이유는 무엇일까요?"
    ],
  },
  {
    id: 'scamper',
    name: 'SCAMPER',
    description: '아이디어를 7가지 관점(대체, 결합, 응용, 변경, 다른 용도, 제거, 재배열)에서 탐색하여 발전시키는 기법입니다.',
    questions: [
      "Substitute (대체): 아이디어의 일부를 다른 것으로 대체할 수 있나요? (사람, 장소, 재료, 기능 등)",
      "Combine (결합): 다른 아이디어나 기능과 결합할 수 있나요?",
      "Adapt (응용): 다른 분야의 아이디어나 해결책을 응용할 수 있나요? 과거의 비슷한 사례는 없었나요?",
      "Modify/Magnify/Minify (변경/확대/축소): 아이디어의 형태, 속성, 의미를 변경하거나, 특정 부분을 강조하거나 축소할 수 있나요?",
      "Put to another use (다른 용도): 현재 아이디어를 다른 문제나 다른 고객에게 적용할 수 있나요?",
      "Eliminate (제거): 아이디어의 불필요한 부분을 제거하여 단순화할 수 있나요? 핵심 기능만 남긴다면?",
      "Rearrange/Reverse (재배열/반전): 아이디어의 순서, 구성 요소, 진행 방식을 바꾸거나 거꾸로 생각해 볼 수 있나요?",
    ],
  },
  // Add Six Thinking Hats module
  {
    id: 'sixhats',
    name: '육색 사고모자',
    description: '여섯 가지 색깔 모자가 상징하는 관점(정보, 감정, 비판, 긍정, 창의, 과정)에서 아이디어를 체계적으로 분석합니다.',
    questions: [
      "White Hat (정보): 이 아이디어에 대해 우리가 알고 있는 객관적인 사실과 정보는 무엇인가요?",
      "Red Hat (감정): 이 아이디어에 대해 직관적으로 어떤 느낌이 드나요? (좋다, 싫다, 흥미롭다, 불안하다 등 이유 설명 없이)",
      "Black Hat (비판/위험): 이 아이디어의 잠재적인 문제점, 약점, 위험 요소는 무엇일까요? 무엇이 잘못될 수 있나요?",
      "Yellow Hat (긍정/가치): 이 아이디어의 장점, 긍정적인 측면, 기대되는 가치와 이익은 무엇인가요?",
      "Green Hat (창의/대안): 이 아이디어를 더 발전시킬 새로운 아이디어나 대안은 없을까요? 기존의 틀을 벗어나 생각해본다면?",
      "Blue Hat (과정/통제): 지금까지 논의된 내용을 요약하고, 앞으로 무엇을 더 생각해야 할까요? 전체 과정을 어떻게 관리할 수 있을까요?",
    ],
  },
  // 여기에 다른 모듈들을 추가할 수 있습니다. (e.g., 육색모자, 강제연상법 등)
];

// Helper function to get questions by module ID
export const getQuestionsByModuleId = (moduleId: string | null | undefined): string[] => {
  const module = trainingModules.find(m => m.id === moduleId);
  // If module not found or moduleId is null/undefined, return basic questions as default
  return module ? module.questions : trainingModules.find(m => m.id === 'basic')?.questions || [];
};

// Helper function to get module details by ID (useful for displaying name/description)
export const getModuleById = (moduleId: string | null | undefined): TrainingModule | undefined => {
    if (!moduleId) {
        return trainingModules.find(m => m.id === 'basic'); // Return basic if no ID
    }
    return trainingModules.find(m => m.id === moduleId);
}; 