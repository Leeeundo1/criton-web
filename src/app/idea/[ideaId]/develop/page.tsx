'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import components for each section
const OverviewSection = dynamic(() => import('@/components/develop/OverviewSection'));
const TrainingSection = dynamic(() => import('@/components/develop/TrainingSection'));
const MapSection = dynamic(() => import('@/components/develop/MapSection'));
const SummarySection = dynamic(() => import('@/components/develop/SummarySection'));

// Placeholder components until we create the real ones
// You can remove these once the actual components are created
// const PlaceholderComponent = ({ name }: { name: string }) => <div className="p-4 border rounded bg-gray-100">{name} Component Placeholder</div>;
// const OverviewSection = () => <PlaceholderComponent name="Overview" />;
// const TrainingSection = () => <PlaceholderComponent name="Training" />;
// const MapSection = () => <PlaceholderComponent name="Map" />;
// const SummarySection = () => <PlaceholderComponent name="Summary" />;


export default function DevelopPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ideaId = params.ideaId as string;
  const section = searchParams.get('section') || 'overview'; // Default section

  const renderSection = () => {
    switch (section) {
      case 'training':
        return <TrainingSection ideaId={ideaId} />;
      case 'map':
        return <MapSection ideaId={ideaId} />;
      case 'summary':
        return <SummarySection ideaId={ideaId} />;
      case 'overview':
      default:
        return <OverviewSection ideaId={ideaId} />;
    }
  };

  if (!ideaId) {
    return <div>아이디어 ID가 필요합니다.</div>;
  }

  return (
    renderSection()
  );
} 