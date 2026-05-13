'use client'

/**
 * components/training/markdown-view.tsx
 *
 * Shared markdown renderer for AI output (chat answers, study summaries).
 *
 * Why a wrapper:
 *   - The AI returns GFM-flavoured markdown (headings, bold, lists, tables).
 *     Rendering it with `whitespace-pre-line` shows the literal `**`, `###`,
 *     `*` characters, which is what the user reported.
 *   - We use `react-markdown` + `remark-gfm` (tables, task lists, strikethrough).
 *   - Tailwind classes give consistent typography that fits inside a chat
 *     bubble or a card. We deliberately avoid `prose` from `@tailwindcss/typography`
 *     because it isn't installed and the styling can be controlled tightly here.
 *
 * Security: `react-markdown` does NOT execute embedded HTML by default. We
 * never set `rehype-raw`, so anything the model emits is rendered as text.
 */

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  children: string
  /** Override tone — chat bubbles use `compact`, panels use `default`. */
  variant?: 'default' | 'compact'
}

function cls(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ')
}

export function MarkdownView({ children, variant = 'default' }: Props) {
  const compact = variant === 'compact'

  const components: Components = {
    h1: ({ children }) => (
      <h1
        className={cls(
          'font-semibold tracking-tight',
          compact ? 'text-base mt-2 first:mt-0' : 'text-xl mt-4 first:mt-0',
        )}
      >
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        className={cls(
          'font-semibold tracking-tight',
          compact ? 'text-sm mt-2 first:mt-0' : 'text-lg mt-3 first:mt-0',
        )}
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        className={cls(
          'font-semibold tracking-tight text-muted-foreground',
          compact ? 'text-xs mt-2 first:mt-0' : 'text-base mt-3 first:mt-0',
        )}
      >
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-semibold mt-2 first:mt-0">{children}</h4>
    ),
    p: ({ children }) => (
      <p className={cls('leading-relaxed', compact ? 'my-1' : 'my-2')}>
        {children}
      </p>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => (
      <ul
        className={cls(
          'list-disc pl-5 space-y-1',
          compact ? 'my-1' : 'my-2',
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={cls(
          'list-decimal pl-5 space-y-1',
          compact ? 'my-1' : 'my-2',
        )}
      >
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      // Inline code (no language class) gets a pill; fenced code gets a block.
      const isInline = !className
      if (isInline) {
        return (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {children}
          </code>
        )
      }
      return (
        <code className="font-mono text-[0.85em]">{children}</code>
      )
    },
    pre: ({ children }) => (
      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed my-2">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-3 border-border" />,
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/60">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border-b px-3 py-1.5 text-left font-medium">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b px-3 py-1.5 align-top">{children}</td>
    ),
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
