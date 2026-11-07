import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Network,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  Layers,
  Database,
  Cpu,
  Lock,
  Globe,
  Radio,
  Share2,
  RefreshCw,
  Info,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  Server,
  Zap
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  CorrelationReport,
  ThreatGraphNode,
  ThreatGraphEdge,
  ThreatIntelOverview,
  ThreatPattern
} from '../types';

export const ThreatIntelPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId') || '';

  const [reportIdInput, setReportIdInput] = useState(initialReportId);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<ThreatIntelOverview | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationReport | null>(null);
  const [selectedNode, setSelectedNode] = useState<ThreatGraphNode | null>(null);
  const [expandingNeighborhood, setExpandingNeighborhood] = useState(false);

  // Load platform-wide overview metrics
  const fetchOverview = async () => {
    try {
      setOverviewLoading(true);
      const data = await apiService.getThreatIntelOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load overview metrics', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Trigger correlation query
  const handleCorrelate = async (targetId: string) => {
    if (!targetId || !targetId.trim()) {
      setError('Please provide a valid Report ID.');
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const data = await apiService.correlateReport(targetId.trim(), 'AUTO');
      setCorrelation(data);
      setSearchParams({ reportId: targetId.trim() });
    } catch (err: any) {
      console.error('Correlation error', err);
      setError(err?.response?.data?.detail || 'Unable to correlate report. Ensure report ID is valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReportId) {
      handleCorrelate(initialReportId);
    }
  }, [initialReportId]);

  // Expand graph neighborhood for a selected node
  const handleExpandNode = async (nodeId: string) => {
    if (!correlation) return;
    setExpandingNeighborhood(true);
    try {
      const related = await apiService.getRelatedThreats(nodeId);
      // Merge new nodes and edges
      const existingNodeIds = new Set(correlation.graph.nodes.map(n => n.id));
      const existingEdgeKeys = new Set(correlation.graph.edges.map(e => `${e.source}->${e.target}:${e.relationship_type}`));

      const mergedNodes = [...correlation.graph.nodes];
      for (const n of related.graph.nodes) {
        if (!existingNodeIds.has(n.id)) {
          mergedNodes.push(n);
          existingNodeIds.add(n.id);
        }
      }

      const mergedEdges = [...correlation.graph.edges];
      for (const e of related.graph.edges) {
        const key = `${e.source}->${e.target}:${e.relationship_type}`;
        if (!existingEdgeKeys.has(key)) {
          mergedEdges.push(e);
          existingEdgeKeys.add(key);
        }
      }

      setCorrelation({
        ...correlation,
        graph: {
          nodes: mergedNodes,
          edges: mergedEdges,
        },
      });
    } catch (err: any) {
      console.error('Failed to expand neighborhood', err);
    } finally {
      setExpandingNeighborhood(false);
    }
  };

  // Node coloring and icon helper
  const getNodeVisuals = (node: ThreatGraphNode) => {
    const t = node.indicator_type.toUpperCase();
    if (t === 'URL') return { color: '#06b6d4', bg: 'bg-cyan-500/20', border: 'border-cyan-400', label: 'URL', icon: Globe };
    if (t === 'DOMAIN') return { color: '#3b82f6', bg: 'bg-blue-500/20', border: 'border-blue-400', label: 'Domain', icon: Server };
    if (t === 'IP') return { color: '#a855f7', bg: 'bg-purple-500/20', border: 'border-purple-400', label: 'IP', icon: Radio };
    if (t.includes('CERT')) return { color: '#10b981', bg: 'bg-emerald-500/20', border: 'border-emerald-400', label: 'TLS Cert', icon: Lock };
    if (t.includes('ISSUER')) return { color: '#14b8a6', bg: 'bg-teal-500/20', border: 'border-teal-400', label: 'CA Issuer', icon: CheckCircle };
    if (t === 'MESSAGE') return { color: '#f59e0b', bg: 'bg-amber-500/20', border: 'border-amber-400', label: 'Message', icon: Mail };
    if (t === 'EMAIL') return { color: '#ec4899', bg: 'bg-pink-500/20', border: 'border-pink-400', label: 'Email', icon: Mail };
    if (t === 'PHONE') return { color: '#8b5cf6', bg: 'bg-violet-500/20', border: 'border-violet-400', label: 'Phone', icon: Phone };
    return { color: '#94a3b8', bg: 'bg-slate-500/20', border: 'border-slate-400', label: 'Indicator', icon: Network };
  };

  // Layout node positions in SVG canvas
  const layoutNodes = useMemo(() => {
    if (!correlation?.graph?.nodes || correlation.graph.nodes.length === 0) return [];
    const nodes = correlation.graph.nodes;
    const centerX = 400;
    const centerY = 250;
    const count = nodes.length;

    if (count === 1) {
      return [{ ...nodes[0], x: centerX, y: centerY }];
    }

    return nodes.map((node, idx) => {
      // Put root/primary node near center
      if (idx === 0) {
        return { ...node, x: centerX, y: centerY };
      }
      // Position surrounding nodes in concentric rings
      const angle = ((idx - 1) / (count - 1)) * 2 * Math.PI;
      const radius = count > 8 ? (idx % 2 === 0 ? 200 : 130) : 160;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      return { ...node, x, y };
    });
  }, [correlation?.graph?.nodes]);

  // Map nodes by ID for fast edge lookup
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const n of layoutNodes) {
      map.set(n.id, { x: n.x, y: n.y });
    }
    return map;
  }, [layoutNodes]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Page Title & Subtitle */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <Network className="w-3.5 h-3.5" /> Module 4: Intelligent Threat Correlation
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Threat Intelligence Graph & Campaign Correlation
            </h1>
            <p className="text-slate-400 mt-2 max-w-3xl text-sm md:text-base leading-relaxed">
              Connects indicators across URL structure, DNS networks, TLS certificates, and scam messaging patterns to uncover hidden infrastructure and multi-vector campaigns.
            </p>
          </div>
          <button
            onClick={() => { fetchOverview(); if (correlation) handleCorrelate(correlation.report_id); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Telemetry
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Global Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> Indicators
              </div>
              <div className="text-2xl font-bold text-white">{overview.total_indicators}</div>
              <div className="text-xs text-slate-500 mt-1">Monitored entities</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> Domains
              </div>
              <div className="text-2xl font-bold text-white">{overview.unique_domains}</div>
              <div className="text-xs text-slate-500 mt-1">Unique root hosts</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Server className="w-3.5 h-3.5 text-purple-400" /> IP Subnets
              </div>
              <div className="text-2xl font-bold text-white">{overview.unique_ips}</div>
              <div className="text-xs text-slate-500 mt-1">Hosting IPs tracked</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Certificates
              </div>
              <div className="text-2xl font-bold text-white">{overview.unique_certificates}</div>
              <div className="text-xs text-slate-500 mt-1">X.509 fingerprints</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Relationships
              </div>
              <div className="text-2xl font-bold text-white">{overview.suspicious_relationships}</div>
              <div className="text-xs text-slate-500 mt-1">Graph edge connections</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Patterns
              </div>
              <div className="text-2xl font-bold text-white">{overview.detected_threat_patterns}</div>
              <div className="text-xs text-slate-500 mt-1">Campaign rules matched</div>
            </div>
          </div>
        )}

        {/* Target Search / Selection Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" /> Investigate & Correlate Report
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Enter a Report ID from any URL scan (Module 1/2) or Scam Message scan (Module 3) to construct its real-time correlation graph.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleCorrelate(reportIdInput); }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !reportIdInput.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
              {loading ? 'Correlating...' : 'Analyze Correlation'}
            </button>
          </form>

          {/* Quick select from recent correlations */}
          {overview?.recent_correlations && overview.recent_correlations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium mr-2">Recent Correlations:</span>
              <div className="inline-flex flex-wrap gap-2 mt-2">
                {overview.recent_correlations.map((rc) => (
                  <button
                    key={rc.id}
                    onClick={() => { setReportIdInput(rc.report_id); handleCorrelate(rc.report_id); }}
                    className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <span className="font-mono">{rc.report_id.slice(0, 8)}...</span>
                    <span className={`text-[10px] px-1 rounded ${
                      rc.risk_level === 'CONFIRMED_MALICIOUS' ? 'bg-red-500/20 text-red-400' :
                      rc.risk_level === 'HIGH_RISK' ? 'bg-orange-500/20 text-orange-400' :
                      rc.risk_level === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {rc.risk_level}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Active Correlation Analysis Dossier */}
        {correlation && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      correlation.risk_level === 'CONFIRMED_MALICIOUS' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      correlation.risk_level === 'HIGH_RISK' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      correlation.risk_level === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      correlation.risk_level === 'LOW_RISK' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}>
                      {correlation.risk_level.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Report: {correlation.report_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Type: {correlation.report_type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">
                    Multi-Module Threat Synthesis
                  </h2>
                  <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                    {correlation.summary}
                  </p>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Correlated Risk</div>
                    <div className={`text-4xl font-extrabold ${
                      correlation.correlation_score >= 80 ? 'text-red-400' :
                      correlation.correlation_score >= 50 ? 'text-orange-400' :
                      correlation.correlation_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {correlation.correlation_score}
                      <span className="text-sm text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Confidence</div>
                    <div className="text-2xl font-bold text-indigo-400">
                      {Math.round(correlation.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Threat Relationship Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-base">Threat Relationship Topology</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> URL
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block ml-1" /> Domain
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block ml-1" /> IP
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block ml-1" /> Cert
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block ml-1" /> Message
                  </div>
                </div>

                <div className="relative flex-1 min-h-[460px] bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
                  <svg
                    viewBox="0 0 800 500"
                    className="w-full h-full max-h-[500px] select-none"
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="22"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                      </marker>
                    </defs>

                    {/* Edges */}
                    {correlation.graph.edges.map((edge) => {
                      const src = nodePositionMap.get(edge.source);
                      const tgt = nodePositionMap.get(edge.target);
                      if (!src || !tgt) return null;

                      const midX = (src.x + tgt.x) / 2;
                      const midY = (src.y + tgt.y) / 2;

                      return (
                        <g key={edge.id} className="transition-all duration-300">
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke="#334155"
                            strokeWidth="2"
                            strokeDasharray={edge.relationship_type.includes('REDIRECT') ? '4,4' : undefined}
                            markerEnd="url(#arrow)"
                          />
                          <text
                            x={midX}
                            y={midY - 5}
                            fill="#94a3b8"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="bg-slate-950 px-1"
                          >
                            {edge.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {layoutNodes.map((node) => {
                      const visuals = getNodeVisuals(node);
                      const isSelected = selectedNode?.id === node.id;
                      const isHighRisk = node.risk_score >= 70;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          onClick={() => setSelectedNode(node)}
                          className="cursor-pointer group"
                        >
                          {/* Pulsing ring for high-risk nodes */}
                          {isHighRisk && (
                            <circle
                              r="26"
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              strokeOpacity="0.4"
                              className="animate-ping"
                            />
                          )}

                          <circle
                            r="20"
                            fill="#0f172a"
                            stroke={isSelected ? '#f8fafc' : visuals.color}
                            strokeWidth={isSelected ? 3 : 2}
                            className="transition-colors duration-200 group-hover:scale-110"
                          />

                          <text
                            y="4"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {visuals.label.slice(0, 3)}
                          </text>

                          {/* Node Label underneath */}
                          <text
                            y="34"
                            textAnchor="middle"
                            fill="#cbd5e1"
                            fontSize="10"
                            fontFamily="sans-serif"
                            className="pointer-events-none drop-shadow"
                          >
                            {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute bottom-3 left-3 text-xs text-slate-500 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-800">
                    Click any node to inspect evidence or expand infrastructure connections.
                  </div>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" />
                    Indicator Inspector
                  </h3>

                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Entity Type</div>
                        <div className="text-sm font-semibold text-indigo-300 mt-0.5">{selectedNode.indicator_type}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Normalized Value</div>
                        <div className="text-sm font-mono text-white break-all bg-slate-950 p-2.5 rounded border border-slate-800 mt-1">
                          {selectedNode.normalized_value}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                          <div className="text-xs text-slate-500">Risk Assessment</div>
                          <div className={`text-sm font-bold mt-1 ${
                            selectedNode.risk_level === 'CONFIRMED_MALICIOUS' ? 'text-red-400' :
                            selectedNode.risk_level === 'HIGH_RISK' ? 'text-orange-400' :
                            selectedNode.risk_level === 'SUSPICIOUS' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {selectedNode.risk_level}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                          <div className="text-xs text-slate-500">Occurrences</div>
                          <div className="text-sm font-bold text-white mt-1">
                            {selectedNode.occurrence_count} times seen
                          </div>
                        </div>
                      </div>

                      {selectedNode.details && Object.keys(selectedNode.details).length > 0 && (
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Metadata Attributes</div>
                          <pre className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto max-h-36">
                            {JSON.stringify(selectedNode.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={() => handleExpandNode(selectedNode.id)}
                        disabled={expandingNeighborhood}
                        className="w-full mt-2 py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                      >
                        {expandingNeighborhood ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                        {expandingNeighborhood ? 'Expanding...' : 'Expand 2-Hop Neighborhood'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500 text-sm">
                      <Network className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      Select a node on the graph to inspect threat telemetry, attributes, and connected entities.
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500">
                  Total Nodes: <span className="font-semibold text-slate-300">{correlation.graph.nodes.length}</span> |
                  Edges: <span className="font-semibold text-slate-300 ml-1">{correlation.graph.edges.length}</span>
                </div>
              </div>
            </div>

            {/* Detected Threat Patterns */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Detected Campaign Patterns ({correlation.patterns.length})
              </h3>

              {correlation.patterns.length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-400 text-sm">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  No cross-module malicious correlation patterns identified. Findings appear isolated and non-coordinated.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {correlation.patterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        pat.severity === 'CRITICAL' ? 'bg-red-950/20 border-red-800/60' :
                        pat.severity === 'HIGH' ? 'bg-orange-950/20 border-orange-800/60' :
                        pat.severity === 'MEDIUM' ? 'bg-amber-950/20 border-amber-800/60' :
                        'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">{pat.pattern_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          pat.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                          pat.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                          pat.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {pat.severity}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{pat.description}</p>
                      {pat.reason && (
                        <p className="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                          <span className="text-indigo-300 font-semibold">Technical Grounding: </span>
                          {pat.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Correlation Explanation & Evidence Transparency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grounded Narrative */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  Evidence-Grounded AI Explanation
                </h3>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed font-medium">
                  {correlation.explanation.summary}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reasoning Factors</div>
                  {correlation.explanation.reasoning.map((r, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {correlation.explanation.recommendations.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-800">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tactical Recommendations</div>
                    {correlation.explanation.recommendations.map((rec, i) => (
                      <div key={i} className="text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Transparency */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  Forensic Evidence Transparency
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified External Evidence</span>
                    {correlation.evidence_transparency.verified_external_evidence.length === 0 ? (
                      <div className="text-xs text-slate-500 italic mt-1">No verified third-party threat feeds triggered.</div>
                    ) : (
                      correlation.evidence_transparency.verified_external_evidence.map((ev, i) => (
                        <div key={i} className="text-xs font-mono text-red-300 bg-red-950/20 border border-red-800/40 p-2 rounded mt-1">
                          {ev.provider}: {ev.detections || ev.verdict}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Technical Observations</span>
                    {correlation.evidence_transparency.technical_observations.length === 0 ? (
                      <div className="text-xs text-slate-500 italic mt-1">No anomalous technical observations noted.</div>
                    ) : (
                      correlation.evidence_transparency.technical_observations.map((obs, i) => (
                        <div key={i} className="text-xs text-slate-300 bg-slate-950 border border-slate-800 p-2 rounded mt-1">
                          <span className="font-semibold text-slate-400">{obs.category}: </span>
                          {obs.observation}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correlated Heuristic Rules</span>
                    <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 p-2 rounded mt-1">
                      {correlation.evidence_transparency.rule_based_correlations.length} multi-module correlation rule(s) evaluated and confirmed.
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500 leading-relaxed">
                  Strict Evidence Demarcation: AI summaries are strictly constrained to structural technical telemetry and rule-based graph connections to eliminate hallucinated risks.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ThreatIntelPage;

