import React from 'react';

export default function Breadcrumb({ steps = [], currentStep = 0, onStepClick })
{
    const canClick = typeof onStepClick === 'function';

    return (
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {steps.map((step, index) =>
            {
                const isPastOrCurrent = index <= currentStep;
                const isClickable = canClick && isPastOrCurrent;
                const content = (
                    <span className={`text-sm ${index === currentStep
                        ? 'text-[#00B75A] font-[600]'
                        : index < currentStep
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        } ${isClickable ? 'cursor-pointer hover:underline hover:text-[#00B75A]' : ''}`}>
                        {step}
                    </span>
                );
                return (
                    <React.Fragment key={index}>
                        <div className="flex items-center gap-2">
                            {isClickable ? (
                                <button
                                    type="button"
                                    onClick={() => onStepClick(index)}
                                    className="bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit"
                                >
                                    {content}
                                </button>
                            ) : (
                                content
                            )}
                        </div>
                        {index < steps.length - 1 && (
                            <span className="text-gray-400">›</span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
