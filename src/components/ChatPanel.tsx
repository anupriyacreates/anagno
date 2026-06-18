import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ChatMessage, FrameworkDef, PendingFinding } from "../types";
import type { ExistingNode } from "../api";
import { streamChat, extractNodes, getFollowups } from "../api";
import WaveLoader from "./WaveLoader";
import Markdown from "./Markdown";

const CHAT_COLOR = "#7bbfb5";

interface Props {
  context: string;
  nodes: ExistingNode[];
  disabled: boolean;
  onPromote: (items: PendingFinding[]) => void;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  /** Lenses attached to the next query; when present, sending runs a scoped dive. */
  lenses: FrameworkDef[];
  /** Runs the attached lenses scoped to the query; resolves to the reply text. */
  onRunQuery: (focus: string) => Promise<string>;
  onAddLens: () => void;
  onRemoveLens: (f: FrameworkDef) => void;
}

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

const StarI = ({ on }: { on?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={on ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" />
  </svg>
);
const PinI = ({ on }: { on?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={on ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 3h6l-1 6 3 3v2h-5v6l-1 1-1-1v-6H4v-2l3-3z" />
  </svg>
);

export default function ChatPanel({
  context,
  nodes,
  disabled,
  onPromote,
  messages,
  setMessages,
  lenses,
  onRunQuery,
  onAddLens,
  onRemoveLens,
}: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractingIdx, setExtractingIdx] = useState<number | null>(null);
  const [pulled, setPulled] = useState<Record<number, number>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showStarred, setShowStarred] = useState(false);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // contextual follow-ups: only once a reply has landed, relevant to the thread
  useEffect(() => {
    if (streaming) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || !last.content.trim()) {
      setSuggestions([]);
      return;
    }
    let live = true;
    getFollowups(context, messages, nodes)
      .then((r) => live && setSuggestions(r.suggestions.slice(0, 3)))
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, streaming]);

  async function run(text: string) {
    const t = text.trim();
    if (!t || streaming || disabled) return;
    setError(null);
    setSuggestions([]);
    const history: ChatMessage[] = [...messages, { role: "user", content: t }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      if (lenses.length > 0) {
        // lens-scoped dive: findings flow to the Surface pane; reply is the intro
        const reply = await onRunQuery(t);
        setMessages((m) => {
          const copy = [...m];
          const last = copy.length - 1;
          copy[last] = {
            ...copy[last],
            content: reply || "Surfaced findings to your Surface pane.",
          };
          return copy;
        });
      } else {
        await streamChat({ context, messages: history, nodes }, (chunk) => {
          setMessages((m) => {
            const copy = [...m];
            const last = copy.length - 1;
            copy[last] = { ...copy[last], content: copy[last].content + chunk };
            return copy;
          });
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last && last.role === "assistant" && last.content === "")
          return m.slice(0, -1);
        return m;
      });
    } finally {
      setStreaming(false);
    }
  }

  function send() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    run(t);
  }

  const toggleStar = (idx: number) =>
    setMessages((m) =>
      m.map((msg, i) => (i === idx ? { ...msg, starred: !msg.starred } : msg)),
    );
  const togglePin = (idx: number) =>
    setMessages((m) =>
      m.map((msg, i) => (i === idx ? { ...msg, pinned: !msg.pinned } : msg)),
    );

  const snippet = (t: string) =>
    t
      .replace(/[#*`_>~]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);

  function jumpTo(i: number) {
    if (showStarred) setShowStarred(false);
    requestAnimationFrame(() => {
      msgRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashIdx(i);
      window.setTimeout(() => setFlashIdx((f) => (f === i ? null : f)), 1600);
    });
  }

  const pinnedList = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.pinned);
  const starredCount = messages.filter((m) => m.starred).length;

  async function pull(idx: number, text: string) {
    if (extractingIdx !== null) return;
    setExtractingIdx(idx);
    setError(null);
    try {
      const res = await extractNodes(context, text, nodes);
      const items: PendingFinding[] = res.findings.map((finding) => ({
        id: uid(),
        frameworkId: "__chat__",
        frameworkName: "From chat",
        frameworkColor: CHAT_COLOR,
        finding,
      }));
      onPromote(items);
      setPulled((p) => ({ ...p, [idx]: items.length }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't pull findings.");
    } finally {
      setExtractingIdx(null);
    }
  }

  return (
    <div className="chat">
      {(pinnedList.length > 0 || starredCount > 0) && (
        <div className="chat-saved">
          {pinnedList.map(({ m, i }) => (
            <button
              key={i}
              className="chat-pinned-item"
              onClick={() => jumpTo(i)}
              title="Jump to pinned response"
            >
              <PinI on />
              <span>{snippet(m.content)}</span>
            </button>
          ))}
          {starredCount > 0 && (
            <button
              className={`chat-starred-toggle ${showStarred ? "on" : ""}`}
              onClick={() => setShowStarred((s) => !s)}
              title={showStarred ? "Show all" : "Show starred only"}
            >
              <StarI on />
              {starredCount} starred
            </button>
          )}
        </div>
      )}

      <div className="chat-log">
        {showStarred && starredCount === 0 && (
          <div className="chat-empty-note">No starred responses yet.</div>
        )}
        {messages.length === 0 && !streaming && (
          <div className="chat-welcome">
            <div className="chat-welcome-spark">✨</div>
            <h3>Ask Anagno</h3>
          </div>
        )}

        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          const streamingThis =
            streaming && isAssistant && i === messages.length - 1;
          if (showStarred && !m.starred) return null;
          return (
            <div
              key={i}
              ref={(el) => {
                msgRefs.current[i] = el;
              }}
              className={`chat-msg ${isAssistant ? "from-bot" : "from-user"} ${
                flashIdx === i ? "flash" : ""
              }`}
            >
              <div className="chat-bubble">
                {m.content
                  ? isAssistant
                    ? <Markdown text={m.content} />
                    : m.content
                  : null}
                {streamingThis && m.content === "" && <WaveLoader />}
              </div>
              {isAssistant && m.content && !streamingThis && (
                <div className="chat-msg-actions">
                  <button
                    className="chat-add"
                    disabled={extractingIdx !== null}
                    onClick={() => pull(i, m.content)}
                  >
                    {extractingIdx === i ? "Pulling…" : "Add to canvas"}
                  </button>
                  <button
                    className={`chat-msg-ic ${m.starred ? "on" : ""}`}
                    onClick={() => toggleStar(i)}
                    title={m.starred ? "Unstar" : "Star"}
                    aria-label={m.starred ? "Unstar response" : "Star response"}
                    aria-pressed={!!m.starred}
                  >
                    <StarI on={m.starred} />
                  </button>
                  <button
                    className={`chat-msg-ic ${m.pinned ? "on" : ""}`}
                    onClick={() => togglePin(i)}
                    title={m.pinned ? "Unpin" : "Pin"}
                    aria-label={m.pinned ? "Unpin response" : "Pin response"}
                    aria-pressed={!!m.pinned}
                  >
                    <PinI on={m.pinned} />
                  </button>
                  {pulled[i] != null && (
                    <span className="pulled-note">
                      {pulled[i]} added to Surface
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      {messages.length > 0 && suggestions.length > 0 && !streaming && (
        <div className="chat-followups">
          {suggestions.map((s) => (
            <button
              key={s}
              className="chat-suggestion"
              disabled={disabled}
              onClick={() => run(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat-composer">
        <div className="chat-lensbar">
          {lenses.map((f) => (
            <span
              className="chat-lens-chip"
              key={f.id}
              style={{ "--accent": f.color } as React.CSSProperties}
            >
              <span className="chat-lens-dot" />
              {f.name}
              <button
                className="chat-lens-x"
                onClick={() => onRemoveLens(f)}
                aria-label={`Detach ${f.name}`}
                title={`Detach ${f.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            className="chat-lens-add"
            onClick={onAddLens}
            title="Attach a lens"
          >
            ＋ Lens
          </button>
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder={
              disabled
                ? "Set a research context first…"
                : lenses.length > 0
                  ? "Ask through the attached lens…"
                  : "Ask a follow-up…"
            }
            value={input}
            disabled={disabled || streaming}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className={`chat-send ${lenses.length > 0 ? "dive" : ""}`}
            disabled={disabled || streaming || !input.trim()}
            onClick={send}
          >
            {streaming ? "…" : lenses.length > 0 ? "Dive" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
