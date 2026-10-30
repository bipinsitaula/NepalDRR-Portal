'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Phone, WifiOff } from 'lucide-react';
import { usePortalStore } from '@/lib/store';
import { useUserLocation } from '@/lib/location';
import { alertsFor, resourcesNear, formatKm } from '@/lib/nearby';
import { DISTRICTS } from '@/data/locations';
import { findGuide, guideAsText } from '@/data/safetyGuides';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Answered from the built-in guides because the AI service was unreachable. */
  offline?: boolean;
}

const SITUATIONS = {
  en: [
    'Water is rising near my house',
    'We just felt an earthquake',
    'I see cracks on the hill above us',
    'Someone is injured and bleeding',
    'There is a fire nearby',
    'How do I prepare an emergency bag?'
  ],
  ne: [
    'मेरो घर नजिक पानी बढ्दैछ',
    'भर्खरै भूकम्प गयो',
    'माथिको पहाडमा चिरा देखियो',
    'कोही घाइते छन्, रगत बगिरहेको छ',
    'नजिकै आगलागी भएको छ',
    'आपतकालीन झोला कसरी तयार गर्ने?'
  ]
};

const QUICK_CALLS = [
  { label: 'Ambulance', number: '102' },
  { label: 'Police', number: '100' },
  { label: 'Disaster', number: '1155' }
];

export default function AssistantPage() {
  const { alerts, resources, language } = usePortalStore();
  const { location } = useUserLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const context = useMemo(() => {
    if (!location) return {};
    const district = DISTRICTS.find((d) => d.id === location.districtId);
    return {
      district: district?.name,
      alerts: alertsFor(alerts, location).map((a) => `${a.severity}: ${a.title}. Instruction: ${a.instruction}`),
      shelters: resourcesNear(resources, location, ['shelter', 'ambulance', 'rescue_team'])
        .slice(0, 4)
        .map((r) => `${r.name} (${r.category.replace('_', ' ')}), ${formatKm(r.distanceKm)} away, phone ${r.phone}`)
    };
  }, [location, alerts, resources]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const answerOffline = () =>
      setMessages([...history, { role: 'assistant', content: guideAsText(findGuide(content)), offline: true }]);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          context
        }),
        signal: controller.signal
      });

      if (!res.ok || !res.body) {
        answerOffline();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: 'assistant', content: answer }]);
      }
      if (!answer.trim()) answerOffline();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') answerOffline();
    } finally {
      setBusy(false);
    }
  };

  const situations = SITUATIONS[language];

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-text">What should I do?</h1>
          <p className="text-sm text-muted">
            Describe what is happening and get clear steps to stay safe.
            {location ? '' : ' Share your location on the SOS page for advice about your area.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">In danger now?</span>
          {QUICK_CALLS.map((c) => (
            <a key={c.number} href={`tel:${c.number}`} className="inline-flex items-center gap-1 rounded-full border border-crimson/30 px-2.5 py-1 font-medium text-crimson hover:bg-crimson/5">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {c.label} {c.number}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-4" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">Start with your situation</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {situations.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="w-full rounded-lg border border-line bg-white px-4 py-3 text-left text-sm text-text hover:border-accent"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-2.5 text-sm text-white">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="max-w-[92%]">
              <div className="panel rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-text">
                {m.content ? <FormattedText text={m.content} /> : <TypingDots />}
              </div>
              {m.offline && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <WifiOff className="h-3.5 w-3.5" aria-hidden />
                  Built-in safety guide. The AI assistant is not connected right now.
                </p>
              )}
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-16 -mx-4 mt-6 bg-page px-4 pb-3 pt-2 lg:bottom-0"
      >
        <div className="flex items-end gap-2 rounded-xl border border-line bg-white p-2 shadow-lg shadow-ink/5 focus-within:border-accent">
          <label htmlFor="assistant-input" className="sr-only">
            Describe your situation
          </label>
          <textarea
            id="assistant-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={language === 'ne' ? 'के भइरहेको छ, लेख्नुहोस्…' : 'Describe what is happening…'}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-muted/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="btn btn-primary h-10 w-10 shrink-0 rounded-lg p-0"
            aria-label="Send"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted">
          AI guidance can be wrong. Always follow instructions from emergency services.
        </p>
      </form>
    </div>
  );
}

/** Renders line breaks and **bold** from the assistant's plain-text replies. */
function FormattedText({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) =>
        line.trim() === '' ? null : (
          <p key={i}>
            {line
              .replace(/^#+\s*/, '')
              .split(/(\*\*[^*]+\*\*)/g)
              .map((part, j) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={j} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <React.Fragment key={j}>{part}</React.Fragment>
                )
              )}
          </p>
        )
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Writing a reply">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}
