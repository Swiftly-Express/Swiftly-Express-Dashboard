import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const StyledDropdown = ({ value, onChange, options = [], tooltips = {}, className = '', width = 'w-44' }) => {
    const [open, setOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);
    const [tooltipPos, setTooltipPos] = useState(null); // { left, top }
    const ref = useRef(null);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
        setHoveredOption(null);
        setTooltipPos(null);
    };

    const popoverPositionClass = width === 'w-full' ? 'left-0' : 'left-1/2 transform -translate-x-1/2';

    const isFull = width === 'w-full';
    const buttonBase = isFull ? 'justify-between w-full px-4 py-2 rounded-full bg-transparent border-none' : 'gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50';

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setOpen(v => !v)}
                className={`flex items-center ${buttonBase} text-sm`}
                aria-haspopup="listbox"
                aria-expanded={open}
                type="button"
            >
                <span className="flex-1 text-left truncate">{value}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
            </button>

            {open && (
                <div className={`absolute z-50 mt-2 ${popoverPositionClass} ${width} bg-white border border-gray-200 rounded-lg shadow-lg`} role="listbox">
                    <ul className="max-h-56 overflow-auto">
                        {options.map((opt) => (
                            <li key={opt} className="relative group">
                                <button
                                    onClick={() => handleSelect(opt)}
                                    onMouseEnter={(e) => {
                                        setHoveredOption(opt);
                                        try {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTooltipPos({ left: rect.left + rect.width / 2, top: rect.top });
                                        } catch (err) {
                                            setTooltipPos(null);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredOption(null);
                                        setTooltipPos(null);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${opt === value ? 'bg-gray-100 font-medium' : ''}`}
                                    type="button"
                                >
                                    {opt}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Tooltip portal: render above everything using fixed coords */}
            {hoveredOption && tooltipPos && tooltips[hoveredOption] && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: tooltipPos.left,
                        top: tooltipPos.top - 8,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 2147483647,
                        maxWidth: 320
                    }}
                >
                    <div className="p-3 text-white text-xs rounded-lg shadow-lg" style={{ background: '#00B75A' }}>
                        <div style={{ position: 'absolute', left: '50%', bottom: '-6px', width: 10, height: 10, background: '#00B75A', transform: 'translateX(-50%) rotate(45deg)' }} />
                        {tooltips[hoveredOption]}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StyledDropdown;
