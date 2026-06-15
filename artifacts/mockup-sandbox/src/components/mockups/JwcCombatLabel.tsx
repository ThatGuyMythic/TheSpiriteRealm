export default function JwcCombatLabel() {
  return (
    <div className="flex flex-col gap-12 p-8 bg-slate-100 min-h-screen items-center justify-center">
      <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">
        JWC COMBAT — UI Label Reference
      </p>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">

        {/* Phone UI */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Phone (Mobile)</span>
          <div
            className="relative bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
            style={{ width: 390, height: 844 }}
          >
            {/* Status bar placeholder */}
            <div className="bg-slate-900 h-10 w-full flex items-center px-6 justify-between">
              <span className="text-white text-xs">9:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-white/60 rounded-sm" />
                <div className="w-3 h-2 bg-white/60 rounded-sm" />
                <div className="w-4 h-2 bg-white/40 rounded-sm" />
              </div>
            </div>

            {/* App content placeholder */}
            <div className="bg-slate-700 h-full flex flex-col gap-4 p-4 pt-3">
              <div className="bg-slate-600 rounded-xl h-48 w-full" />
              <div className="flex gap-3">
                <div className="bg-slate-600 rounded-lg h-24 flex-1" />
                <div className="bg-slate-600 rounded-lg h-24 flex-1" />
              </div>
              <div className="bg-slate-600 rounded-xl h-32 w-full" />
              <div className="bg-slate-600 rounded-xl h-20 w-full" />
              <div className="bg-slate-600 rounded-xl h-20 w-full" />
            </div>

            {/* ✅ JWC COMBAT label — top-right overlay, does NOT affect layout */}
            <div
              className="absolute top-3 right-4 z-50 pointer-events-none select-none"
              style={{ top: 44 }}
            >
              <span
                className="text-white font-black tracking-widest uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  opacity: 0.92,
                }}
              >
                JWC COMBAT
              </span>
            </div>
          </div>
        </div>

        {/* Desktop UI */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Browser (Desktop)</span>
          <div
            className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl"
            style={{ width: 960, height: 580 }}
          >
            {/* Browser chrome */}
            <div className="bg-slate-900 h-10 w-full flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4 bg-slate-700 rounded-md h-5" />
            </div>

            {/* App content placeholder */}
            <div className="bg-slate-700 h-full flex gap-0">
              {/* Sidebar */}
              <div className="bg-slate-900/60 w-56 flex-shrink-0 p-3 flex flex-col gap-2">
                <div className="bg-slate-600 rounded h-8 w-full" />
                <div className="bg-slate-600 rounded h-6 w-full mt-1" />
                <div className="bg-slate-600 rounded h-6 w-full" />
                <div className="bg-slate-600 rounded h-6 w-full" />
                <div className="bg-slate-600 rounded h-6 w-3/4" />
              </div>
              {/* Main */}
              <div className="flex-1 p-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="bg-slate-600 rounded-xl h-28 flex-1" />
                  <div className="bg-slate-600 rounded-xl h-28 flex-1" />
                  <div className="bg-slate-600 rounded-xl h-28 flex-1" />
                </div>
                <div className="bg-slate-600 rounded-xl h-52 w-full" />
                <div className="flex gap-3">
                  <div className="bg-slate-600 rounded-xl h-20 flex-1" />
                  <div className="bg-slate-600 rounded-xl h-20 flex-1" />
                </div>
              </div>
            </div>

            {/* ✅ JWC COMBAT label — top-right overlay, does NOT affect layout */}
            <div
              className="absolute z-50 pointer-events-none select-none"
              style={{ top: 48, right: 16 }}
            >
              <span
                className="text-white font-black tracking-widest uppercase"
                style={{
                  fontSize: 13,
                  letterSpacing: "0.14em",
                  textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                  opacity: 0.92,
                }}
              >
                JWC COMBAT
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl px-6 py-4 shadow text-sm text-slate-600 max-w-xl text-center">
        The <strong className="text-slate-900">JWC COMBAT</strong> label sits at the{" "}
        <strong className="text-slate-900">top-right corner</strong> on both views using{" "}
        <code className="bg-slate-100 px-1 rounded text-slate-700">position: absolute</code> — it overlaps content without
        shifting any other elements.
      </div>
    </div>
  );
}
