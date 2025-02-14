import React from 'react';
import TensionVisualization from './TensionVisualization';
import { AlertCircle } from 'lucide-react';

export default function Tensions() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Tension Control</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm">Symbols in yellow are not accounted for in the Tension / Slack path</span>
          </div>
        </div>
        <TensionVisualization />
      </div>
    </div>
  );
}