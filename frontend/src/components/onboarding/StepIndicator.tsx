// components/onboarding/StepIndicator.tsx
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
          <div key={stepNumber} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= stepNumber 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}
            >
              {stepNumber}
            </div>
            <div className="text-xs mt-1 text-gray-500">
              {stepNumber === 1 && 'Organisation'}
              {stepNumber === 2 && 'Domaines'}
              {stepNumber === 3 && 'Finalisation'}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-1 w-full bg-gray-200">
        <div 
          className="h-1 bg-blue-600" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepIndicator;