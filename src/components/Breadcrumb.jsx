import React from 'react';

export default function Breadcrumb({ steps = [], currentStep = 0 }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${index === currentStep
                                ? 'text-[#00B75A] font-[600]'
                                : index < currentStep
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                            }`}>
                            {step}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <span className="text-gray-400">›</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
