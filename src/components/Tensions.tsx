import React from 'react';
import TensionVisualization from './TensionVisualization';

export default function Tensions() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Tension Control</h2>
        <TensionVisualization />
      </div>
    </div>
  );
}