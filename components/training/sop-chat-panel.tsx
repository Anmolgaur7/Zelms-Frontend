'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { askSopChat } from '@/lib/actions/employee'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  SendIcon,
  SparklesIcon,
  UserIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
}

interface PanelProps {
  sopId: string
}

export function SopChatPanel({ sopId }: PanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const q = question.trim()
    if (q.length < 3) {
      toast.error('Question must be at least 3 characters.')
      return
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
    }
    setMessages((m) => [...m, userMsg])
    setQuestion('')

    startTransition(async () => {
      const result = await askSopChat(sopId, q)
      if (result.error) {
        setMessages((m) => [
          ...m,
          {
            id: `e-${Date.now()}`,
            role: 'error',
            content: `${result.error.message} (${result.error.code})`,
          },
        ])
        return
      }
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: result.data!.answer ?? '(no answer returned)',
        },
      ])
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isPending) handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[520px]">
      {/* Message stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-md border bg-muted/20 p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <SparklesIcon className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No questions yet. Ask anything about this SOP — for example:
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {[
                'What is the main purpose of this SOP?',
                'What PPE is required?',
                'What are the cleaning steps?',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  className="rounded-full border bg-background hover:bg-accent px-3 py-1 text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {isPending && (
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <SparklesIcon className="h-4 w-4" />
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="mt-3 flex gap-2 items-end">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about this SOP (Enter to send, Shift+Enter for newline)"
          rows={2}
          disabled={isPending}
          className="resize-none"
        />
        <Button
          size="lg"
          onClick={handleSend}
          disabled={isPending || question.trim().length < 3}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-2 justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2 text-sm">
          {message.content}
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserIcon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    )
  }
  if (message.role === 'error') {
    return (
      <div className="flex gap-2">
        <div className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <AlertCircleIcon className="h-3.5 w-3.5 text-rose-600" />
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-800">
          {message.content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <SparklesIcon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-background border px-4 py-2 text-sm whitespace-pre-line">
        {message.content}
      </div>
    </div>
  )
}
