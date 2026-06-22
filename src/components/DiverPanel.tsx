import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ChatMessage, FrameworkDef, PendingFinding } from "../types";
import type { ExistingNode } from "../api";
import FrameworkLibrary from "./FrameworkLibrary";
import PanelIcon from "./PanelIcon";
import ChatPanel from "./ChatPanel";

interface Thread {
  id: string;
  title: string;
  messages: ChatMessage[];
  starred: boolean;
  pinned: boolean;
}

interface Props {
  width: number;
  library: FrameworkDef[];
  bucket: FrameworkDef[];
  onToggleBucket: (f: FrameworkDef) => void;
  onAddCustom: (name: string) => void;
  onCollapse: () => void;
  context: string;
  nodes: ExistingNode[];
  canChat: boolean;
  onPromote: (items: PendingFinding[]) => void;
  projectKey: string;
  onRunQuery: (focus: string) => Promise<string>;
}

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

const NEW_THREAD: Thread = {
  id: "t1",
  title: "New chat",
  messages: [],
  starred: false,
  pinned: false,
};

function loadThreads(key: string): Thread[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const t = JSON.parse(raw);
      if (Array.isArray(t) && t.length) return t as Thread[];
    }
  } catch {
    /* ignore */
  }
  return [{ ...NEW_THREAD }];
}

const I = ({ d, fill = "none" }: { d: string; fill?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export default function DiverPanel({
  width,
  library,
  bucket,
  onToggleBucket,
  onAddCustom,
  onCollapse,
  context,
  nodes,
  canChat,
  onPromote,
  projectKey,
  onRunQuery,
}: Props) {
  const storageKey = `anagno:chat:${projectKey}`;
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads(storageKey));
  const [activeId, setActiveId] = useState<string>(() => threads[0].id);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(threads));
    } catch {
      /* ignore */
    }
  }, [threads, storageKey]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const inBucket = (id: string) => bucket.some((f) => f.id === id);
  const quick = useMemo(() => library.filter((f) => f.popular), [library]);

  const setMessages: Dispatch<SetStateAction<ChatMessage[]>> = (update) => {
    setThreads((ts) =>
      ts.map((t) => {
        if (t.id !== activeId) return t;
        const next =
          typeof update === "function"
            ? (update as (m: ChatMessage[]) => ChatMessage[])(t.messages)
            : update;
        let title = t.title;
        if (title === "New chat") {
          const firstUser = next.find((m) => m.role === "user");
          if (firstUser)
            title =
              firstUser.content.slice(0, 30) +
              (firstUser.content.length > 30 ? "…" : "");
        }
        return { ...t, messages: next, title };
      }),
    );
  };

  function newChat() {
    const id = uid();
    setThreads((ts) => [
      ...ts,
      { id, title: "New chat", messages: [], starred: false, pinned: false },
    ]);
    setActiveId(id);
    setHistoryOpen(false);
  }
  const toggleStar = (id: string) =>
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
    );
  const togglePin = (id: string) =>
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
    );
  function deleteThread(id: string) {
    const remaining = threads.filter((t) => t.id !== id);
    if (remaining.length === 0) {
      const fresh = { ...NEW_THREAD, id: uid() };
      setThreads([fresh]);
      setActiveId(fresh.id);
    } else {
      if (id === activeId) setActiveId(remaining[0].id);
      setThreads(remaining);
    }
  }

  const ordered = useMemo(() => {
    return [...threads].sort((a, b) => {
      const sa = (a.pinned ? 2 : 0) + (a.starred ? 1 : 0);
      const sb = (b.pinned ? 2 : 0) + (b.starred ? 1 : 0);
      if (sa !== sb) return sb - sa;
      return threads.indexOf(b) - threads.indexOf(a);
    });
  }, [threads]);

  function addCustom() {
    const n = custom.trim();
    if (!n) return;
    onAddCustom(n);
    setCustom("");
  }

  const wide = width >= 520;
  const sidebar = wide && sidebarOpen;

  const threadRow = (t: Thread) => (
    <div key={t.id} className={`fchat-thread ${t.id === activeId ? "on" : ""}`}>
      <button
        className="fchat-thread-pick"
        onClick={() => {
          setActiveId(t.id);
          setHistoryOpen(false);
        }}
      >
        {t.pinned && <span className="fchat-pindot" />}
        {t.title}
      </button>
      <button
        className={`fchat-thread-ic ${t.starred ? "on" : ""}`}
        onClick={() => toggleStar(t.id)}
        title={t.starred ? "Unstar" : "Star"}
        aria-label={t.starred ? "Unstar chat" : "Star chat"}
        aria-pressed={t.starred}
      >
        <I
          d="M12 17.3l-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z"
          fill={t.starred ? "currentColor" : "none"}
        />
      </button>
      <button
        className={`fchat-thread-ic ${t.pinned ? "on" : ""}`}
        onClick={() => togglePin(t.id)}
        title={t.pinned ? "Unpin" : "Pin"}
        aria-label={t.pinned ? "Unpin chat" : "Pin chat"}
        aria-pressed={t.pinned}
      >
        <I
          d="M9 3h6l-1 6 3 3v2h-5v6l-1 1-1-1v-6H4v-2l3-3z"
          fill={t.pinned ? "currentColor" : "none"}
        />
      </button>
      <button
        className="fchat-thread-ic fchat-thread-del"
        onClick={() => deleteThread(t.id)}
        title="Delete chat"
        aria-label="Delete chat"
      >
        <I d="M4 7h16M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12M9 7V4h6v3" />
      </button>
    </div>
  );

  return (
    <aside
      className={`diver ${sidebar ? "is-wide" : ""}`}
      style={{ flex: `0 0 ${width}px`, width }}
    >
      <div className="diver-wave" aria-hidden />

      <div className="pane-head">
        <span className="pane-title">Dive</span>
        <div className="fchat-acts">
          <button
            className="fchat-act"
            onClick={newChat}
            title="New chat"
            aria-label="New chat"
          >
            <I d="M12 5v14M5 12h14" />
          </button>
          <button
            className={`fchat-act ${(wide ? sidebarOpen : historyOpen) ? "on" : ""}`}
            onClick={() =>
              wide ? setSidebarOpen((o) => !o) : setHistoryOpen((o) => !o)
            }
            title={wide ? "Toggle chat list" : "Chat history"}
            aria-label={wide ? "Toggle chat list" : "Chat history"}
            aria-expanded={wide ? sidebarOpen : historyOpen}
          >
            <I d="M4 6h16M4 12h16M4 18h10" />
          </button>
          <button
            className="pane-collapse"
            onClick={onCollapse}
            title="Collapse panel"
            aria-label="Collapse panel"
          >
            <PanelIcon side="left" />
          </button>
        </div>
      </div>

      {!wide && historyOpen && (
        <div className="fchat-history">{ordered.map(threadRow)}</div>
      )}

      <div className="dive-body">
        {sidebar && (
          <div className="dive-threads">
            <button className="dive-threads-new" onClick={newChat}>
              <I d="M12 5v14M5 12h14" />
              New chat
            </button>
            <div className="dive-threads-list">{ordered.map(threadRow)}</div>
          </div>
        )}
        <div className="dive-conv">
          <ChatPanel
            key={activeId}
            context={context}
            nodes={nodes}
            disabled={!canChat}
            onPromote={onPromote}
            messages={active.messages}
            setMessages={setMessages}
            lenses={bucket}
            onRunQuery={onRunQuery}
            onAddLens={() => setPickerOpen((o) => !o)}
            onRemoveLens={onToggleBucket}
          />
        </div>
      </div>

      {pickerOpen && (
        <>
          <div className="lenspicker-scrim" onClick={() => setPickerOpen(false)} />
          <div className="lenspicker">
            <div className="lenspicker-head">
              <span>Attach a lens</span>
              <button
                className="lenspicker-close"
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="lib">
              {quick.map((f) => {
                const added = inBucket(f.id);
                return (
                  <div
                    key={f.id}
                    className={`chip ${added ? "chip-in" : ""}`}
                    title={f.description}
                  >
                    <span className="chip-name">{f.name}</span>
                    <button
                      className="chip-add"
                      onClick={() => onToggleBucket(f)}
                      aria-label={
                        added ? `Detach ${f.name}` : `Attach ${f.name}`
                      }
                    >
                      {added ? "✓" : "+"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="diver-custom">
              <input
                value={custom}
                placeholder="add a custom lens…"
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
              />
              <button onClick={addCustom}>+</button>
            </div>
            <button
              className="lib-open-btn"
              onClick={() => {
                setLibOpen(true);
                setPickerOpen(false);
              }}
            >
              Browse full library
            </button>
          </div>
        </>
      )}

      {libOpen && (
        <FrameworkLibrary
          library={library}
          bucket={bucket}
          onToggle={onToggleBucket}
          onClose={() => setLibOpen(false)}
        />
      )}
    </aside>
  );
}
