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
import { useTheme } from '../context/ThemeContext';

export const ThreatIntelPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId') || '';
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [reportIdInput, setReportIdInput] = useState(initialReportId);
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<ThreatIntelOverview | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationReport | null>(null);
  const [selectedNode, setSelectedNode] = useState<ThreatGraphNode | null>(null);
  const [expandingNeighborhood, setExpandingNeighborhood] = useState(false);

  // Load platform-wide overview metrics
  const fetchOverview = async (autoSelectDefault: boolean = true) => {
    try {
      setOverviewLoading(true);
      const data = await apiService.getThreatIntelOverview();
      setOverview(data);

      // Auto-load top correlated investigation if none is active
      if (autoSelectDefault && !initialReportId && data.recent_correlations && data.recent_correlations.length > 0) {
        const top = data.recent_correlations[0];
        setReportIdInput(top.target_label || top.report_id);
        handleCorrelate(top.report_id);
      }
    } catch (err: any) {
      console.error('Failed to load overview metrics', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(!initialReportId);
  }, []);

  // Trigger correlation query
  const handleCorrelate = async (targetId: string) => {
    if (!targetId || !targetId.trim()) {
      setError('Please provide a domain, URL, or report ID to investigate.');
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const data = await apiService.correlateReport(targetId.trim(), 'AUTO');
      setCorrelation(data);
      setSearchParams({ reportId: data.report_id });
    } catch (err: any) {
      console.error('Correlation error', err);
      setError(
        err?.response?.data?.detail ||
        'Unable to correlate investigation. Please select one of the active threat investigations below or search by domain (e.g. paypa1-security-update.com).'
      );
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
    if (t === 'URL') return { color: '#06b6d4', bg: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-cyan-400', label: 'URL', icon: Globe };
    if (t === 'DOMAIN') return { color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-400', label: 'Domain', icon: Server };
    if (t === 'IP') return { color: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-400', label: 'IP', icon: Radio };
    if (t.includes('CERT')) return { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-400', label: 'TLS Cert', icon: Lock };
    if (t.includes('ISSUER')) return { color: '#14b8a6', bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-400', label: 'CA Issuer', icon: CheckCircle };
    if (t === 'MESSAGE') return { color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-400', label: 'Message', icon: Mail };
    if (t === 'EMAIL') return { color: '#ec4899', bg: 'bg-pink-50 dark:bg-pink-950/40', border: 'border-pink-400', label: 'Email', icon: Mail };
    if (t === 'PHONE') return { color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-400', label: 'Phone', icon: Phone };
    return { color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-900/60', border: 'border-slate-400', label: 'Indicator', icon: Network };
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
      if (idx === 0) {
        return { ...node, x: centerX, y: centerY };
      }
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans">
      {/* Page Title & Subtitle */}
      <div className="border-b border-slate-300 dark:border-[#1A2844] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-yellow-400/10 text-blue-700 dark:text-yellow-400 border border-blue-200 dark:border-yellow-400/30 mb-3">
            <Network className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Intelligent Threat Correlation
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-3">
            Threat Intelligence Graph & Campaign Correlation
          </h1>
          <p className="text-slate-800 dark:text-slate-300 mt-2 max-w-3xl text-sm md:text-base leading-relaxed font-medium">
            Connects indicators across URL structure, DNS networks, TLS certificates, and scam messaging patterns to uncover hidden infrastructure and multi-vector campaigns.
          </p>
        </div>
        <button
          onClick={() => { fetchOverview(false); if (correlation) handleCorrelate(correlation.report_id); }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D1629] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-xl text-sm font-bold border border-slate-300 dark:border-[#1A2844] shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4 text-blue-600 dark:text-yellow-400" /> Refresh Telemetry
        </button>
      </div>

      <div className="space-y-8">
        {/* Global Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Indicators
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.total_indicators}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">Monitored entities</div>
            </div>

            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Domains
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.unique_domains}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">Unique root hosts</div>
            </div>

            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Server className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> IP Subnets
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.unique_ips}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">Hosting IPs tracked</div>
            </div>

            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Certificates
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.unique_certificates}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">X.509 fingerprints</div>
            </div>

            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Relationships
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.suspicious_relationships}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">Graph connections</div>
            </div>

            <div className="phish-card p-4">
              <div className="text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" /> Patterns
              </div>
              <div className="text-2xl font-extrabold text-slate-950 dark:text-white font-mono">{overview.detected_threat_patterns}</div>
              <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">Campaign rules matched</div>
            </div>
          </div>
        )}

        {/* Target Search / Selection Box */}
        <div className="phish-card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600 dark:text-yellow-400" /> Investigate Threat Campaign
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">
            Search any domain, URL, indicator or report ID to construct its real-time multi-vector threat topology graph.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleCorrelate(reportIdInput); }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              placeholder="Enter domain, URL, or report ID (e.g. paypa1-security-update.com)"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/50 focus:border-blue-500 dark:focus:border-yellow-400 transition"
            />
            <button
              type="submit"
              disabled={loading || !reportIdInput.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-slate-950 disabled:opacity-50 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
              {loading ? 'Correlating...' : 'Analyze Correlation'}
            </button>
          </form>

          {/* Quick select from recent correlations */}
          {overview?.recent_correlations && overview.recent_correlations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-800 dark:text-slate-300 font-bold mr-2 uppercase tracking-wider">Active Investigations:</span>
              <div className="inline-flex flex-wrap gap-2 mt-2">
                {overview.recent_correlations.map((rc) => {
                  const isSelected = correlation?.report_id === rc.report_id;
                  const label = rc.target_label || `${rc.report_id.slice(0, 8)}...`;
                  return (
                    <button
                      key={rc.id}
                      onClick={() => {
                        setReportIdInput(label);
                        handleCorrelate(rc.report_id);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 transition font-semibold ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-yellow-400/15 border-blue-400 dark:border-yellow-400 text-blue-900 dark:text-yellow-300 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="font-mono">{label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        rc.risk_level === 'CONFIRMED_MALICIOUS' ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300' :
                        rc.risk_level === 'HIGH_RISK' ? 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300' :
                        rc.risk_level === 'SUSPICIOUS' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                      }`}>
                        {rc.risk_level.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && !correlation && (
          <div className="phish-card p-12 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Correlating Multi-Vector Telemetry...</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
              Traversing DNS infrastructure, TLS certificates, and message patterns to map threat relationships.
            </p>
          </div>
        )}

        {/* Ready / Waiting for selection state */}
        {!correlation && !loading && (
          <div className="phish-card p-12 text-center flex flex-col items-center justify-center">
            <Network className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready for Investigation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md">
              Select one of the active threat investigations above or search any domain to generate its real-time correlation graph.
            </p>
          </div>
        )}

        {/* Active Correlation Analysis Dossier */}
        {correlation && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary Banner */}
            <div className="phish-card p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      correlation.risk_level === 'CONFIRMED_MALICIOUS' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                      correlation.risk_level === 'HIGH_RISK' ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800' :
                      correlation.risk_level === 'SUSPICIOUS' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                      correlation.risk_level === 'LOW_RISK' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {correlation.risk_level.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Report: {correlation.report_id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                      Type: {correlation.report_type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    Unified Threat Synthesis
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                    {correlation.summary}
                  </p>
                </div>

                {/* Score Dial */}
                <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Correlated Risk</div>
                    <div className={`text-4xl font-extrabold font-mono ${
                      correlation.correlation_score >= 80 ? 'text-rose-600 dark:text-rose-400' :
                      correlation.correlation_score >= 50 ? 'text-orange-600 dark:text-orange-400' :
                      correlation.correlation_score >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {correlation.correlation_score}
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">/100</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Confidence</div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {Math.round(correlation.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Threat Relationship Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 phish-card p-5 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Threat Relationship Topology</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> URL
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block ml-1" /> Domain
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block ml-1" /> IP
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-1" /> Cert
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-1" /> Message
                  </div>
                </div>

                <div className="relative flex-1 min-h-[460px] bg-slate-50/70 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
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
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={isDark ? '#64748B' : '#94A3B8'} />
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
                            stroke={isDark ? '#334155' : '#CBD5E1'}
                            strokeWidth="2"
                            strokeDasharray={edge.relationship_type.includes('REDIRECT') ? '4,4' : undefined}
                            markerEnd="url(#arrow)"
                          />
                          <text
                            x={midX}
                            y={midY - 5}
                            fill={isDark ? '#94A3B8' : '#475569'}
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="select-none font-semibold"
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
                            fill={isDark ? '#0f172a' : '#ffffff'}
                            stroke={isSelected ? (isDark ? '#FACC15' : '#2563EB') : visuals.color}
                            strokeWidth={isSelected ? 3 : 2}
                            className="transition-colors duration-200 group-hover:scale-110 shadow-sm"
                          />

                          <text
                            y="4"
                            textAnchor="middle"
                            fill={isDark ? '#f8fafc' : '#0f172a'}
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {visuals.label.slice(0, 3)}
                          </text>

                          {/* Node Label underneath */}
                          <text
                            y="34"
                            textAnchor="middle"
                            fill={isDark ? '#cbd5e1' : '#334155'}
                            fontSize="10"
                            fontFamily="sans-serif"
                            className="pointer-events-none font-medium select-none"
                          >
                            {node.label.length > 20 ? `${node.label.slice(0, 18)}...` : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute bottom-3 left-3 text-xs text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    Click any node to inspect evidence or expand infrastructure connections.
                  </div>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="phish-card p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
                    Indicator Inspector
                  </h3>

                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Entity Type</div>
                        <div className="text-sm font-semibold text-blue-700 dark:text-yellow-400 mt-0.5">{selectedNode.indicator_type}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Normalized Value</div>
                        <div className="text-sm font-mono text-slate-900 dark:text-white break-all bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                          {selectedNode.normalized_value}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Risk Assessment</div>
                          <div className={`text-sm font-bold mt-1 ${
                            selectedNode.risk_level === 'CONFIRMED_MALICIOUS' ? 'text-rose-600 dark:text-rose-400' :
                            selectedNode.risk_level === 'HIGH_RISK' ? 'text-orange-600 dark:text-orange-400' :
                            selectedNode.risk_level === 'SUSPICIOUS' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {selectedNode.risk_level}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Occurrences</div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {selectedNode.occurrence_count} times seen
                          </div>
                        </div>
                      </div>

                      {selectedNode.details && Object.keys(selectedNode.details).length > 0 && (
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">Metadata Attributes</div>
                          <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-36">
                            {JSON.stringify(selectedNode.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      <button
                        onClick={() => handleExpandNode(selectedNode.id)}
                        disabled={expandingNeighborhood}
                        className="w-full mt-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-yellow-400/10 dark:hover:bg-yellow-400/20 dark:text-yellow-400 dark:border-yellow-400/30 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        {expandingNeighborhood ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                        {expandingNeighborhood ? 'Expanding...' : 'Expand 2-Hop Neighborhood'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
                      <Network className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                      Select a node on the graph to inspect threat telemetry, attributes, and connected entities.
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  Total Nodes: <span className="font-semibold text-slate-800 dark:text-slate-200">{correlation.graph.nodes.length}</span> |
                  Edges: <span className="font-semibold text-slate-800 dark:text-slate-200 ml-1">{correlation.graph.edges.length}</span>
                </div>
              </div>
            </div>

            {/* Detected Threat Patterns */}
            <div className="phish-card p-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Detected Campaign Patterns ({correlation.patterns.length})
              </h3>

              {correlation.patterns.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-slate-600 dark:text-slate-400 text-sm">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  No coordinated campaign attack patterns identified. Findings appear isolated and non-coordinated.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {correlation.patterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        pat.severity === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60' :
                        pat.severity === 'HIGH' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60' :
                        pat.severity === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60' :
                        'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{pat.pattern_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          pat.severity === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300' :
                          pat.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300' :
                          pat.severity === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                        }`}>
                          {pat.severity}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pat.description}</p>
                      {pat.reason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80">
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">Technical Grounding: </span>
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
              <div className="phish-card p-6">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600 dark:text-yellow-400" />
                  Evidence-Grounded AI Explanation
                </h3>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed font-medium">
                  {correlation.explanation.summary}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Reasoning Factors</div>
                  {correlation.explanation.reasoning.map((r, i) => (
                    <div key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-blue-600 dark:text-yellow-400 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {correlation.explanation.recommendations.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Tactical Recommendations</div>
                    {correlation.explanation.recommendations.map((rec, i) => (
                      <div key={i} className="text-xs text-blue-800 dark:text-yellow-400 flex items-center gap-2 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidence Transparency */}
              <div className="phish-card p-6">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600 dark:text-yellow-400" />
                  Forensic Evidence Transparency
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Verified External Evidence</span>
                    {correlation.evidence_transparency.verified_external_evidence.length === 0 ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">No verified third-party threat feeds triggered.</div>
                    ) : (
                      correlation.evidence_transparency.verified_external_evidence.map((ev, i) => (
                        <div key={i} className="text-xs font-mono text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-2.5 rounded-lg mt-1 font-semibold">
                          {ev.provider}: {ev.detections || ev.verdict}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Technical Observations</span>
                    {correlation.evidence_transparency.technical_observations.length === 0 ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">No anomalous technical observations noted.</div>
                    ) : (
                      correlation.evidence_transparency.technical_observations.map((obs, i) => (
                        <div key={i} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg mt-1">
                          <span className="font-bold text-slate-800 dark:text-slate-400">{obs.category}: </span>
                          {obs.observation}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Correlated Heuristic Rules</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg mt-1">
                      {correlation.evidence_transparency.rule_based_correlations.length} heuristic correlation rule(s) evaluated and confirmed.
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
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
