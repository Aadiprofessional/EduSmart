import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
  // Preprocess LaTeX to convert OpenAI format to react-markdown format
  const preprocessLaTeX = (text: string) => {
    return text
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)   // block math
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);    // inline math
  };

  return (
    <div className={`formatted-message ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for different elements
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-gray-800">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-gray-800">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-gray-800">{children}</h3>,
          p: ({ children }) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-700">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-3">
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }: any) => {
            const isInline = !className || !className.includes('language-');
            if (isInline) {
              return (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-3">
                <code className="text-sm font-mono text-gray-800" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          a: ({ children, href }) => (
            <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {preprocessLaTeX(content)}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedMessage; 