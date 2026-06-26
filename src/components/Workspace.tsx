import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useNodesState,
  addEdge,
  applyEdgeChanges,
  reconnectEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type EdgeChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import type {
  ConnectionType,
  FrameworkDef,
  PendingFinding,
  RawFinding,
} from "../types";
import { BUILT_IN_FRAMEWORKS, makeCustomFramework } from "../data/frameworks";
import { diveFramework, scanPatterns } from "../api";
import Board from "./Board";
import DiverPanel from "./DiverPanel";
import AISurface from "./AISurface";
import NodeContextMenu from "./NodeContextMenu";
import ThemeToggle from "./ThemeToggle";
import ExportDialog from "./ExportDialog";
import PanelIcon from "./PanelIcon";
import type { DiverNodeData } from "./DiverNode";
import type { ElementData } from "./CanvasElements";
import type { Tool, AddKind } from "./CanvasToolbar";
import type { NodeActions } from "./nodeActions";

interface Props {
  projectName: string;
  projectContext: string;
  projectKey: string;
  onBack: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const REEF = "#7a9e7e";
const PATTERN_COLOR = "#5c8a62";

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
const norm = (s: string) => s.trim().toLowerCase();
const rot = () => Math.random() * 3 - 1.5;

function edgeFor(source: string, target: string, type: ConnectionType): Edge {
  return {
    id: `${source}__${type}__${target}`,
    source,
    target,
    type: "floating",
    label: type,
    style: { stroke: REEF, strokeWidth: 1.7 },
    markerEnd: { type: MarkerType.ArrowClosed, color: REEF, width: 16, height: 16 },
  };
}

function buildEdges(nodes: Node[]): Edge[] {
  const titleToId = new Map<string, string>();
  for (const n of nodes) {
    const t = (n.data as Partial<DiverNodeData>).title;
    if (typeof t === "string") titleToId.set(norm(t), n.id);
  }
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const n of nodes) {
    const d = n.data as Partial<DiverNodeData>;
    if (!Array.isArray(d.connectsTo) || !d.connectsTo.length) continue;
    const type = (d.connectionType ?? "supports") as ConnectionType;
    for (const target of d.connectsTo) {
      const tid = titleToId.get(norm(target));
      if (!tid || tid === n.id) continue;
      const e = edgeFor(n.id, tid, type);
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      edges.push(e);
    }
  }
  return edges;
}

function placeIn(nodes: Node[], frameworkId: string) {
  const same = nodes.filter(
    (n) => (n.data as Partial<DiverNodeData>).frameworkId === frameworkId,
  );
  if (same.length > 0) {
    return {
      x: same[0].position.x,
      y: Math.max(...same.map((n) => n.position.y)) + 210,
    };
  }
  if (nodes.length === 0) return { x: 60, y: 60 };
  return { x: Math.max(...nodes.map((n) => n.position.x)) + 360, y: 60 };
}

export default function Workspace({
  projectName,
  projectContext,
  projectKey,
  onBack,
  theme,
  onToggleTheme,
}: Props) {
  const [context, setContext] = useState(projectContext);
  const [title, setTitle] = useState(projectName);
  const [editingTitle, setEditingTitle] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState("");
  const [scanFocus, setScanFocus] = useState("");
  const [leftOpen, setLeftOpen] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [customFrameworks, setCustomFrameworks] = useState<FrameworkDef[]>([]);
  const [bucket, setBucket] = useState<FrameworkDef[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [manualEdges, setManualEdges] = useState<Edge[]>([]);
  const [queue, setQueue] = useState<PendingFinding[]>([]);
  const [diving, setDiving] = useState(false);
  const [surfaceOpen, setSurfaceOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(560);
  const [rightWidth, setRightWidth] = useState(320);
  const [scanning, setScanning] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    locked: boolean;
  } | null>(null);
  const [past, setPast] = useState<Node[][]>([]);
  const [future, setFuture] = useState<Node[][]>([]);

  const rfRef = useRef<ReactFlowInstance | null>(null);
  const nodesRef = useRef<Node[]>([]);
  nodesRef.current = nodes;
  const wsBodyRef = useRef<HTMLDivElement>(null);

  // ---------- resizable side panes (panes may not overlap the canvas) ----------
  const PANE_MIN = 248;
  const PANE_MAX = 900;
  const CANVAS_MIN = 340;
  const COLLAPSED_W = 46;
  function startResize(side: "left" | "right") {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      const body = wsBodyRef.current;
      if (!body) return;
      const otherOpen = side === "left" ? surfaceOpen : leftOpen;
      const otherW = side === "left" ? rightWidth : leftWidth;
      const reserved = (otherOpen ? otherW : COLLAPSED_W) + CANVAS_MIN;
      const onMove = (ev: PointerEvent) => {
        const rect = body.getBoundingClientRect();
        const maxAllowed = Math.min(PANE_MAX, rect.width - reserved);
        const raw =
          side === "left" ? ev.clientX - rect.left : rect.right - ev.clientX;
        const w = Math.max(PANE_MIN, Math.min(maxAllowed, raw));
        if (side === "left") setLeftWidth(w);
        else setRightWidth(w);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.classList.remove("resizing-col");
      };
      document.body.classList.add("resizing-col");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
  }
  const clipboardRef = useRef<Node[]>([]);
  const pastRef = useRef<Node[][]>([]);
  pastRef.current = past;
  const futureRef = useRef<Node[][]>([]);
  futureRef.current = future;

  const derivedEdges = useMemo(() => buildEdges(nodes), [nodes]);
  const edges = useMemo(
    () => [...derivedEdges, ...manualEdges],
    [derivedEdges, manualEdges],
  );

  const onConnect = useCallback((c: Connection) => {
    setManualEdges((es) =>
      addEdge(
        {
          ...c,
          id: uid(),
          type: "floating",
          style: { stroke: REEF, strokeWidth: 1.8 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: REEF,
            width: 16,
            height: 16,
          },
        },
        es,
      ),
    );
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setManualEdges((es) => applyEdgeChanges(changes, es));
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setManualEdges((es) => reconnectEdge(oldEdge, newConnection, es));
  }, []);
  const library = useMemo(
    () => [...BUILT_IN_FRAMEWORKS, ...customFrameworks],
    [customFrameworks],
  );
  const nodePayload = useMemo(
    () =>
      nodes
        .map((n) => n.data as Partial<DiverNodeData>)
        .filter((d) => typeof d.title === "string")
        .map((d) => ({ title: d.title as string, category: d.category ?? "" })),
    [nodes],
  );
  const canChat = context.trim().length >= 12;

  // ---------- history ----------
  function pushHistory() {
    setPast((p) => [...p.slice(-49), nodesRef.current]);
    setFuture([]);
  }
  function undo() {
    const p = pastRef.current;
    if (!p.length) return;
    setFuture((f) => [nodesRef.current, ...f]);
    setPast((p2) => p2.slice(0, -1));
    setNodes(p[p.length - 1]);
    setMenu(null);
  }
  function redo() {
    const f = futureRef.current;
    if (!f.length) return;
    setPast((p) => [...p, nodesRef.current]);
    setFuture((f2) => f2.slice(1));
    setNodes(f[0]);
    setMenu(null);
  }

  // ---------- node actions (editing) ----------
  const actions = useMemo<NodeActions>(
    () => ({
      onChange: (id, patch) =>
        setNodes((ns) =>
          ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
        ),
      onDelete: (id) => {
        pushHistory();
        setNodes((ns) => ns.filter((n) => n.id !== id));
      },
      onBeginEdit: () => pushHistory(),
    }),
    [setNodes],
  );

  // ---------- toggle bucket / dive ----------
  function toggleBucket(fw: FrameworkDef) {
    setBucket((b) =>
      b.some((x) => x.id === fw.id) ? b.filter((x) => x.id !== fw.id) : [...b, fw],
    );
  }

  function makeFindingNode(
    p: PendingFinding,
    f: RawFinding,
    pos: { x: number; y: number },
    delay: number,
  ): Node {
    return {
      id: p.id,
      type: "diver",
      position: pos,
      data: {
        title: f.title,
        category: `${p.frameworkName} · ${f.subcategory}`,
        content: f.content,
        color: p.frameworkColor,
        flag: f.flag,
        frameworkId: p.frameworkId,
        connectsTo: f.connectsTo,
        connectionType: f.connectionType,
        rotation: rot(),
        appearDelay: delay,
      } as DiverNodeData,
    };
  }

  // Run the attached lenses scoped to a query; findings flow to the Surface queue.
  // Returns a short reply (Diver's voice) for the chat thread.
  async function runQuery(focus: string): Promise<string> {
    if (!canChat || bucket.length === 0 || diving) return "";
    const lenses = bucket;
    setSurfaceOpen(true);
    setDiving(true);
    setError(null);
    const existing = nodePayload;
    try {
      const results = await Promise.allSettled(
        lenses.map((fw) =>
          diveFramework(context, fw, existing, focus).then((res) => {
            const items: PendingFinding[] = res.findings.map((finding) => ({
              id: uid(),
              frameworkId: fw.id,
              frameworkName: fw.name,
              frameworkColor: fw.color,
              finding,
            }));
            setQueue((q) => [...q, ...items]);
            return { fw, intro: res.intro, count: items.length };
          }),
        ),
      );
      const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      if (results.some((r) => r.status === "rejected")) {
        setError("Some lenses couldn't surface — give it another dive.");
      }
      const total = ok.reduce((s, r) => s + r.count, 0);
      if (total === 0) {
        return "I couldn't surface anything for that — try rephrasing, or a different lens.";
      }
      const names = ok.filter((r) => r.count > 0).map((r) => r.fw.name);
      const lensList =
        names.length <= 1
          ? names[0]
          : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
      if (ok.length === 1 && ok[0].intro) {
        return `${ok[0].intro}\n\n(${total} surfaced — keep, tweak, or toss in the Surface pane.)`;
      }
      return `Surfaced ${total} finding${total === 1 ? "" : "s"} through ${lensList} — check the Surface pane to keep, tweak, or toss.`;
    } finally {
      setDiving(false);
    }
  }

  function keepFinding(id: string, finding: RawFinding) {
    const p = queue.find((q) => q.id === id);
    if (!p) return;
    pushHistory();
    setNodes((ns) => [
      ...ns,
      makeFindingNode(p, finding, placeIn(ns, p.frameworkId), 0),
    ]);
    setQueue((q) => q.filter((x) => x.id !== id));
  }
  function tossFinding(id: string) {
    setQueue((q) => q.filter((x) => x.id !== id));
  }
  function discussFinding(p: PendingFinding) {
    const f = p.finding;
    setChatSeed(`Let's build on this finding — "${f.title}": ${f.content}`);
    setLeftOpen(true);
  }
  function promote(items: PendingFinding[]) {
    if (!items.length) return;
    setQueue((q) => [...q, ...items]);
    setSurfaceOpen(true);
  }

  function addLink(rawUrl: string) {
    let url = rawUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const rf = rfRef.current;
    const center = rf
      ? rf.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 240, y: 180 };
    const jitter = () => Math.round((Math.random() - 0.5) * 48);
    pushHistory();
    setNodes((ns) => [
      ...ns,
      {
        id: uid(),
        type: "link",
        position: { x: center.x + jitter(), y: center.y + jitter() },
        style: { width: 280, height: 200 },
        data: { url, locked: false },
      },
    ]);
  }
  function promptLink() {
    const url = window.prompt("Paste a link — article, video, or page");
    if (url) addLink(url);
  }

  async function scan() {
    if (scanning || nodePayload.length === 0) return;
    setScanning(true);
    setRippleKey((k) => k + 1);
    setError(null);
    setSurfaceOpen(true);
    try {
      const res = await scanPatterns(context, nodePayload, scanFocus.trim() || undefined);
      if (!res.insights.length) {
        setError("Nothing new in the reef this pass — the map looks coherent.");
        return;
      }
      pushHistory();
      setNodes((ns) => {
        const created: Node[] = [];
        res.insights.forEach((f, i) => {
          const pos = placeIn([...ns, ...created], "__patterns__");
          created.push({
            id: uid(),
            type: "diver",
            position: pos,
            data: {
              title: f.title,
              category: `Pattern · ${f.subcategory}`,
              content: f.content,
              color: PATTERN_COLOR,
              flag: f.flag,
              frameworkId: "__patterns__",
              connectsTo: f.connectsTo,
              connectionType: f.connectionType,
              isInsight: true,
              rotation: rot(),
              appearDelay: i * 0.12,
            } as DiverNodeData,
          });
        });
        return [...ns, ...created];
      });
      const big = res.insights.filter((f) => f.flag === "big_deal").length;
      const tension = res.insights.filter(
        (f) => f.flag === "contradiction",
      ).length;
      const bits: string[] = [];
      if (big) bits.push(`${big} emerging insight${big > 1 ? "s" : ""}`);
      if (tension)
        bits.push(`${tension} contradiction${tension > 1 ? "s" : ""}`);
      setNotice(
        bits.length
          ? `Surfaced ${res.insights.length} — ${bits.join(" · ")}`
          : res.intro || `Surfaced ${res.insights.length} new connections.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  // ---------- canvas elements ----------
  function addElement(kind: AddKind) {
    const rf = rfRef.current;
    const center = rf
      ? rf.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 220, y: 160 };
    const jitter = () => Math.round((Math.random() - 0.5) * 48);
    const position = { x: center.x + jitter(), y: center.y + jitter() };
    const id = uid();
    let node: Node;
    if (kind === "text") {
      node = {
        id,
        type: "text",
        position,
        style: { width: 180, height: 48 },
        data: { kind: "text", text: "Text", color: "transparent", locked: false } as ElementData,
      };
    } else if (kind === "sticky") {
      node = {
        id,
        type: "sticky",
        position,
        style: { width: 200, height: 160 },
        data: { kind: "sticky", text: "", color: "#f3e2a9", locked: false } as ElementData,
      };
    } else {
      const shape = kind.startsWith("shape-")
        ? (kind.slice("shape-".length) as ElementData["shape"])
        : "rect";
      node = {
        id,
        type: "shape",
        position,
        style: { width: 184, height: 120 },
        data: { kind: "shape", shape, text: "", color: "#7bbfb5", locked: false } as ElementData,
      };
    }
    pushHistory();
    setNodes((ns) => [...ns, node]);
    setTool("select");
  }

  // ---------- context menu ----------
  function onNodeContextMenu(e: React.MouseEvent, node: Node) {
    e.preventDefault();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
      locked: Boolean((node.data as { locked?: boolean }).locked),
    });
  }
  function duplicate(id: string) {
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n) return;
    pushHistory();
    setNodes((ns) => [
      ...ns,
      {
        ...n,
        id: uid(),
        position: { x: n.position.x + 26, y: n.position.y + 26 },
        selected: false,
      },
    ]);
    setMenu(null);
  }
  function removeNode(id: string) {
    pushHistory();
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setMenu(null);
  }
  function bringFront(id: string) {
    pushHistory();
    setNodes((ns) => {
      const n = ns.find((x) => x.id === id);
      return n ? [...ns.filter((x) => x.id !== id), n] : ns;
    });
    setMenu(null);
  }
  function sendBack(id: string) {
    pushHistory();
    setNodes((ns) => {
      const n = ns.find((x) => x.id === id);
      return n ? [n, ...ns.filter((x) => x.id !== id)] : ns;
    });
    setMenu(null);
  }
  function toggleLock(id: string) {
    pushHistory();
    setNodes((ns) =>
      ns.map((n) => {
        if (n.id !== id) return n;
        const locked = !(n.data as { locked?: boolean }).locked;
        return { ...n, draggable: !locked, data: { ...n.data, locked } };
      }),
    );
    setMenu(null);
  }

  // ---------- keyboard ----------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      const meta = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (meta && k === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (meta && k === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (typing) return;
      const selected = nodesRef.current.filter((n) => n.selected);
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selected.length) {
          pushHistory();
          const ids = new Set(selected.map((n) => n.id));
          setNodes((ns) => ns.filter((n) => !ids.has(n.id)));
        }
        setManualEdges((es) => es.filter((ed) => !ed.selected));
        e.preventDefault();
        return;
      }
      if (meta && k === "d" && selected.length) {
        e.preventDefault();
        pushHistory();
        const copies = selected.map((n) => ({
          ...n,
          id: uid(),
          position: { x: n.position.x + 26, y: n.position.y + 26 },
          selected: false,
        }));
        setNodes((ns) => [...ns, ...copies]);
        return;
      }
      if (meta && (k === "c" || k === "x") && selected.length) {
        e.preventDefault();
        clipboardRef.current = selected.map((n) => ({ ...n }));
        if (k === "x") {
          pushHistory();
          const ids = new Set(selected.map((n) => n.id));
          setNodes((ns) => ns.filter((n) => !ids.has(n.id)));
        }
        return;
      }
      if (meta && k === "v" && clipboardRef.current.length) {
        e.preventDefault();
        pushHistory();
        const clones = clipboardRef.current.map((n) => ({
          ...n,
          id: uid(),
          position: { x: n.position.x + 28, y: n.position.y + 28 },
          selected: true,
        }));
        setNodes((ns) => [
          ...ns.map((n) => (n.selected ? { ...n, selected: false } : n)),
          ...clones,
        ]);
        // cascade subsequent pastes
        clipboardRef.current = clones.map((n) => ({ ...n, selected: false }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // paste a URL anywhere on the canvas → drop a link card
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\/\S+$/i.test(text)) {
        e.preventDefault();
        addLink(text);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ws">
      <header className="topbar">
        <button className="top-home" onClick={onBack} title="Back to projects">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h5v-6h4v6h5V10" />
          </svg>
        </button>

        <div className="top-proj">
          {editingTitle ? (
            <input
              className="top-title-edit"
              autoFocus
              value={title}
              style={{ width: `${Math.max(title.length, 8) + 1}ch` }}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingTitle(false);
              }}
            />
          ) : (
            <span
              className="top-title"
              title="Double-click to rename"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {title || "Untitled project"}
            </span>
          )}
        </div>

        <div className="topbar-spacer" />

        <button
          className="top-desc-btn"
          onClick={() => setContextOpen(true)}
          title="Project description"
        >
          Description
        </button>
        <button
          className="top-desc-btn"
          onClick={() => setExportOpen(true)}
          title="Export / share the canvas"
        >
          Export
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <div className="ws-body" ref={wsBodyRef}>
        {leftOpen ? (
          <DiverPanel
            width={leftWidth}
            library={library}
            bucket={bucket}
            onToggleBucket={toggleBucket}
            onAddCustom={(name) =>
              setCustomFrameworks((c) => [
                ...c,
                makeCustomFramework(name, c.length),
              ])
            }
            onCollapse={() => setLeftOpen(false)}
            context={context}
            nodes={nodePayload}
            canChat={canChat}
            onPromote={promote}
            projectKey={projectKey}
            onRunQuery={runQuery}
            seed={chatSeed}
            onSeedConsumed={() => setChatSeed("")}
          />
        ) : (
          <aside className="pane-collapsed left">
            <button
              className="pane-collapse"
              onClick={() => setLeftOpen(true)}
              title="Expand Dive"
            >
              <PanelIcon side="left" />
            </button>
          </aside>
        )}

        {leftOpen && (
          <div
            className="pane-resizer"
            onPointerDown={startResize("left")}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Dive panel"
          />
        )}

        <Board
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          actions={actions}
          empty={nodes.length === 0}
          rippleKey={rippleKey}
          tool={tool}
          onTool={setTool}
          onInit={(rf) => {
            rfRef.current = rf;
          }}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={() => setMenu(null)}
          onDragStart={() => pushHistory()}
          onAddElement={addElement}
          onAddLink={promptLink}
          onUndo={undo}
          onRedo={redo}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
        />

        {surfaceOpen && (
          <div
            className="pane-resizer"
            onPointerDown={startResize("right")}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Surface panel"
          />
        )}

        {surfaceOpen ? (
          <AISurface
            width={rightWidth}
            queue={queue}
            diving={diving}
            scanning={scanning}
            canScan={nodePayload.length > 0}
            scanFocus={scanFocus}
            onScanFocus={setScanFocus}
            onKeep={keepFinding}
            onToss={tossFinding}
            onDiscuss={discussFinding}
            onScan={scan}
            onClose={() => setSurfaceOpen(false)}
          />
        ) : (
          <aside className="pane-collapsed right">
            <button
              className="pane-collapse"
              onClick={() => setSurfaceOpen(true)}
              title="Expand Surface"
            >
              <PanelIcon side="right" />
            </button>
          </aside>
        )}
      </div>

      {menu && (
        <NodeContextMenu
          x={menu.x}
          y={menu.y}
          locked={menu.locked}
          onDuplicate={() => duplicate(menu.nodeId)}
          onDelete={() => removeNode(menu.nodeId)}
          onFront={() => bringFront(menu.nodeId)}
          onBack={() => sendBack(menu.nodeId)}
          onLock={() => toggleLock(menu.nodeId)}
        />
      )}

      {error && (
        <div className="toast" onClick={() => setError(null)}>
          {error}
          <span className="toast-x">×</span>
        </div>
      )}
      {notice && (
        <div className="toast notice" onClick={() => setNotice(null)}>
          {notice}
          <span className="toast-x">×</span>
        </div>
      )}

      {contextOpen && (
        <div className="modal-scrim" onClick={() => setContextOpen(false)}>
          <div className="login-card" onClick={(e) => e.stopPropagation()}>
            <h2>Project description</h2>
            <p className="login-sub">
              The research context — what you're exploring, who it's for, and the
              scope. Anagno uses this when diving and chatting.
            </p>
            <textarea
              className="field-textarea ctx-modal-text"
              rows={7}
              autoFocus
              value={context}
              placeholder="The problem space, the people, the scope…"
              onChange={(e) => setContext(e.target.value)}
            />
            <button
              className="btn-cta full"
              onClick={() => setContextOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {exportOpen && (
        <ExportDialog
          nodes={nodes}
          title={title}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
