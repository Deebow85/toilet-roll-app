import React from 'react';
import { useProduct } from '../context/ProductContext';
import { Wind, ArrowDown, ArrowRight, Settings } from 'lucide-react';

export default function Downstream() {
  const { settings, calculations } = useProduct();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Downstream Speed Control</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Downstream Speed</h3>
              <Wind className="w-6 h-6 text-sky-500 rotate-180" />
            </div>
            <div className="text-3xl font-bold text-sky-600">
              {calculations.downstreamSpeed.toFixed(1)} <span className="text-lg">m/min</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              95% of line speed for optimal tension
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">Speed Differential</h3>
              <ArrowRight className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="text-3xl font-bold text-indigo-600">
              {(settings.lineSpeed - calculations.downstreamSpeed).toFixed(1)} <span className="text-lg">m/min</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Difference from line speed
            </div>
          </div>
        </div>

        {/* Speed Relationship Diagram */}
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Speed Relationship</h3>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Line Speed:</span>
              <span>{settings.lineSpeed} m/min</span>
            </div>
            <ArrowDown className="w-5 h-5 text-gray-400" />
            <div className="flex items-center space-x-3">
              <Wind className="w-5 h-5 text-sky-500 rotate-180" />
              <span className="font-medium">Downstream Speed:</span>
              <span>{calculations.downstreamSpeed.toFixed(1)} m/min</span>
            </div>
            <div className="text-sm text-gray-600">
              Downstream runs at 95% of line speed to maintain proper tension
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}