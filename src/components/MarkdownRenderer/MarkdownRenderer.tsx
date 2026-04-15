import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-gray-900 mb-3 mt-5 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-gray-800 mb-2 mt-5 border-b border-gray-100 pb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-gray-700 mb-1 mt-4 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-700 mb-3 leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-4 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-4 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-gray-700 leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <code className="block bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
          {children}
        </code>
      )
    }
    return (
      <code className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded font-mono border border-blue-100">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 px-3 py-2">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-sm text-gray-700 border-b border-gray-100 px-3 py-2 align-top">
      {children}
    </td>
  ),
  hr: () => <hr className="border-gray-200 my-5" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-200 pl-4 text-sm text-gray-500 italic mb-3 bg-blue-50 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
}

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}
