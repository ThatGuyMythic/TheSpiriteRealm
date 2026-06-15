import React from "react";

export const C = {
  bg:        "#0F1B2D",
  bg2:       "#162436",
  bg3:       "#1E3048",
  text:      "#D8EEF8",
  textDim:   "#7FA8C4",
  border:    "#000000",
  red:       "#8B2B1D",
  redBright: "#FF1A1A",
  accent:    "#4DBBCC",
  accentDark:"#1A5566",
  cyan:      "#8FD4D9",
  yellow:    "#D4A02B",
  purple:    "#7A1FBF",
  blue:      "#4A9FDF",
  orange:    "#E06820",
  rose:      "#C060A0",
  // legacy aliases kept for page compatibility
  green:     "#4DBBCC",
  greenDark: "#1A5566",
};

export function PText({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <span className={`pixel-text ${className}`} style={{ color: C.text, fontSize: 18, display: "inline", ...style }}>
      {children}
    </span>
  );
}

export function PTitle({ children, style, className = "", color }: { children: React.ReactNode; style?: React.CSSProperties; className?: string; color?: string }) {
  return (
    <div className={`pixel-text ${className}`} style={{ color: color ?? C.text, fontSize: 28, letterSpacing: 1, ...style }}>
      {children}
    </div>
  );
}

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onContextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  small?: boolean;
  "data-testid"?: string;
}

export function PixelButton({
  children, onClick, onContextMenu, onPointerDown, onPointerUp,
  onPointerLeave, onPointerCancel,
  color = C.accent, textColor = "#021A20",
  disabled, style, small, ...rest
}: PixelButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? C.bg3 : color,
        color: disabled ? C.textDim : textColor,
        border: "3px solid #000",
        boxShadow: disabled ? "none" : "3px 3px 0px #000",
        padding: small ? "6px 10px" : "10px 14px",
        fontSize: small ? 16 : 20,
        fontFamily: "'VT323', monospace",
        letterSpacing: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        userSelect: "none",
        WebkitUserSelect: "none",
        transition: "transform 0.05s, box-shadow 0.05s",
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PixelCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: C.bg2,
      border: "3px solid #000",
      boxShadow: "3px 3px 0px #000",
      padding: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function StatChip({ label, value, color = C.yellow, testId }: { label: string; value: React.ReactNode; color?: string; testId?: string }) {
  return (
    <div
      data-testid={testId}
      style={{
        backgroundColor: C.bg3,
        border: "2px solid #000",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <span className="pixel-text" style={{ color, fontSize: 14, letterSpacing: 1 }}>{label}</span>
      <span className="pixel-text" style={{ color: C.text, fontSize: 18 }}>{value}</span>
    </div>
  );
}

export function ScreenHeader({ title, chips, extra }: { title: string; chips?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{
      padding: "8px 12px",
      borderBottom: "3px solid #000",
      backgroundColor: "#08101C",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PTitle style={{ color: C.accent }}>{title}</PTitle>
        {extra}
      </div>
      {chips && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {chips}
        </div>
      )}
    </div>
  );
}
