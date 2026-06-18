import { useState } from "react";

// Shows a real workspace screenshot if one is provided at
// `public/workspace-preview.png`; otherwise falls back to the stylized mock.
export default function LandingPreview() {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        className="lp-img"
        src="/workspace-preview.png"
        alt="The Anagno workspace"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="lp" aria-hidden>
      <div className="lp-bar">
        <span className="lp-trafficdot" />
        <span className="lp-trafficdot" />
        <span className="lp-trafficdot" />
        <span className="lp-bar-title">Anagno — Research retention</span>
      </div>
      <div className="lp-body">
        <div className="lp-diver">
          <div className="lp-wave" />
          <div className="lp-h">Dive</div>
          <div className="lp-chip">PESTEL</div>
          <div className="lp-chip on">Stakeholder</div>
          <div className="lp-chip">Causal Loop</div>
          <div className="lp-dive">Dive ↓</div>
        </div>

        <div className="lp-shore">
          <div className="lp-tools">
            <span className="lp-tool on" />
            <span className="lp-tool" />
            <span className="lp-tool" />
            <span className="lp-tool" />
            <span className="lp-tool" />
          </div>
          <svg className="lp-links" viewBox="0 0 260 200" preserveAspectRatio="none">
            <path className="lp-link" d="M60 70 C 120 70, 110 130, 170 140" />
            <path className="lp-link d2" d="M72 80 C 130 120, 150 110, 196 86" />
          </svg>
          <div className="lp-card c1">
            <span className="lp-card-cat">PESTEL · Tech</span>
            <span className="lp-line w1" />
            <span className="lp-line w2" />
          </div>
          <div className="lp-card c2">
            <span className="lp-card-cat">Stakeholder</span>
            <span className="lp-line w1" />
          </div>
          <div className="lp-card c3 insight">
            <span className="lp-card-cat">⚡ emerging</span>
            <span className="lp-line w2" />
          </div>
          <div className="lp-ripple" />
          <div className="lp-chatpill">✨ Chat</div>
        </div>

        <div className="lp-surface">
          <div className="lp-h dark">Surface</div>
          <div className="lp-confirm">
            <span className="lp-card-cat">Causal Loop</span>
            <span className="lp-line w2" />
            <span className="lp-line w1" />
            <div className="lp-acts">
              <span className="lp-act keep" />
              <span className="lp-act" />
              <span className="lp-act" />
            </div>
          </div>
          <div className="lp-scan">Scan for Patterns</div>
        </div>
      </div>
    </div>
  );
}
