import React, { useState, useRef, useEffect } from 'react';

interface DescriptionDisplayProps {
    content: string;
    maxHeight?: number;
    id?: string;
}

const DescriptionDisplay: React.FC<DescriptionDisplayProps> = ({ content, maxHeight = 200, id }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setIsOverflowing(contentRef.current.scrollHeight > maxHeight);
        }
    }, [content, maxHeight]);

    return (
        <div className="relative" id={id}>
            <div
                ref={contentRef}
                className={`prose prose-sm max-w-none text-gray-600 overflow-hidden break-words transition-all duration-300 ${!isExpanded && isOverflowing ? `max-h-[${maxHeight}px]` : 'max-h-none'}`}
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ maxHeight: !isExpanded && isOverflowing ? `${maxHeight}px` : 'none' }}
            />

            {isOverflowing && (
                <div className={`mt-2 ${!isExpanded ? 'absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center' : 'flex justify-center'}`}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100"
                    >
                        {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                </div>
            )}
            <style>{`
        .prose { white-space: pre-line; overflow-wrap: break-word; word-wrap: break-word; }
        .prose p { margin-bottom: 0.75rem; min-height: 1em; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose h1 { font-size: 1.5rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .prose h2 { font-size: 1.25rem; font-weight: bold; margin-top: 0.75rem; margin-bottom: 0.4rem; }
        .prose h3 { font-size: 1.1rem; font-weight: bold; margin-top: 0.5rem; margin-bottom: 0.3rem; }
      `}</style>
        </div>
    );
};

export default DescriptionDisplay;
