export function ArchitectureFooter() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">OceanX AI — Full Agent Architecture</h3>
      <p className="text-sm text-slate-500 mt-1 mb-5">
        Today's demo implements the 3 highlighted agents. Same pattern extends to the full 9.
      </p>

      <svg
        viewBox="0 0 900 340"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="OceanX 9-agent architecture diagram"
      >
        {/* Defs for arrowheads */}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#94a3b8" />
          </marker>
          <marker id="arrow-purple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#c4b5fd" />
          </marker>
        </defs>

        {/* Supervisor at top */}
        <rect x="340" y="10" width="220" height="44" rx="8" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1.5" strokeDasharray="4 2" />
        <text x="450" y="37" textAnchor="middle" className="text-xs" fill="#6b21a8" fontSize="13" fontWeight="600">Master Supervisor</text>

        {/* Supervisor dashed lines to agents */}
        {[110, 230, 350, 470, 590, 710].map((x) => (
          <line key={`sup-${x}`} x1="450" y1="54" x2={x + 60} y2="100" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow-purple)" />
        ))}
        {[170, 350, 530].map((x) => (
          <line key={`sup2-${x}`} x1="450" y1="54" x2={x + 60} y2="210" stroke="#c4b5fd" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow-purple)" />
        ))}

        {/* Row 1: 6 agents */}
        {/* Customer Acquisition */}
        <AgentNode x={50} y={100} label="Customer" sublabel="Acquisition" highlighted={false} />
        {/* Intake + Underwriting */}
        <AgentNode x={190} y={100} label="Intake +" sublabel="Underwriting" highlighted={true} caption="with Intake" />
        {/* Contract */}
        <AgentNode x={330} y={100} label="Contract" sublabel="Agent" highlighted={true} />
        {/* Operations */}
        <AgentNode x={470} y={100} label="Operations" sublabel="Agent" highlighted={false} />
        {/* Payment */}
        <AgentNode x={610} y={100} label="Payment" sublabel="Agent" highlighted={false} />
        {/* Risk Monitor */}
        <AgentNode x={750} y={100} label="Risk" sublabel="Monitor" highlighted={false} />

        {/* Row 2: 3 agents */}
        <AgentNode x={110} y={210} label="Logistics" sublabel="Agent" highlighted={false} />
        <AgentNode x={290} y={210} label="Inventory" sublabel="Agent" highlighted={false} />
        <AgentNode x={470} y={210} label="Collections" sublabel="Agent" highlighted={false} />

        {/* Flow arrows row 1 */}
        <line x1="160" y1="125" x2="188" y2="125" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="300" y1="125" x2="328" y2="125" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="440" y1="125" x2="468" y2="125" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="580" y1="125" x2="608" y2="125" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="720" y1="125" x2="748" y2="125" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Flow arrows row 2 */}
        <line x1="220" y1="235" x2="288" y2="235" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="400" y1="235" x2="468" y2="235" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Cross-row connections */}
        <line x1="530" y1="150" x2="170" y2="208" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrow)" />
        <line x1="670" y1="150" x2="530" y2="208" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" markerEnd="url(#arrow)" />

        {/* Human checkpoints */}
        <rect x="10" y="290" width="160" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="90" y="313" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="500">↗ Customer Meeting</text>

        <rect x="730" y="290" width="160" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="810" y="313" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="500">↗ Supplier Payment</text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 border border-teal-300 px-3 py-1 text-xs font-medium text-teal-800">
          ▣ Implemented today
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
          □ Production roadmap
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 border-dashed px-3 py-1 text-xs font-medium text-purple-600">
          ⤴ Supervisor oversight
        </span>
      </div>
    </div>
  )
}

function AgentNode({
  x,
  y,
  label,
  sublabel,
  highlighted,
  caption,
}: {
  x: number
  y: number
  label: string
  sublabel: string
  highlighted: boolean
  caption?: string
}) {
  const fill = highlighted ? "#ccfbf1" : "#f8fafc"
  const stroke = highlighted ? "#5eead4" : "#e2e8f0"
  const textColor = highlighted ? "#134e4a" : "#64748b"
  const strokeWidth = highlighted ? "2" : "1"

  return (
    <g>
      <rect x={x} y={y} width="110" height="50" rx="8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text x={x + 55} y={y + 22} textAnchor="middle" fill={textColor} fontSize="12" fontWeight="600">{label}</text>
      <text x={x + 55} y={y + 38} textAnchor="middle" fill={textColor} fontSize="11" opacity="0.7">{sublabel}</text>
      {caption && (
        <text x={x + 55} y={y + 62} textAnchor="middle" fill={textColor} fontSize="9" opacity="0.6">{caption}</text>
      )}
    </g>
  )
}
