import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  Lock,
  ArrowRight,
  Hash,
  Clock,
  UserCheck
} from 'lucide-react';
import { apiService } from '../services/api';
import {
  BlockchainNetworkStatus,
  BlockchainVerifyResponse,
  BlockchainRegisterResponse,
  AnalysisReportListItem
} from '../types';

export const BlockchainRegistryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialReportId = searchParams.get('reportId') || '';

  const [activeTab, setActiveTab] = useState<'verify' | 'register'>('verify');
  const [reportIdInput, setReportIdInput] = useState<string>(initialReportId);
  const [reportType, setReportType] = useState<string>('URL_ANALYSIS');

  // Network & Contract Status
  const [networkStatus, setNetworkStatus] = useState<BlockchainNetworkStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  // Recent local reports for quick selection
  const [recentReports, setRecentReports] = useState<AnalysisReportListItem[]>([]);

  // Verification state
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<BlockchainVerifyResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Registration state
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [registerStep, setRegisterStep] = useState<number>(0);
  const [registerResult, setRegisterResult] = useState<BlockchainRegisterResponse | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const data = await apiService.getBlockchainStatus();
      setNetworkStatus(data);
    } catch (err: any) {
      console.error('Failed to fetch blockchain network status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const data = await apiService.getReports(10, 0);
      setRecentReports(data);
      if (!reportIdInput && data.length > 0) {
        setReportIdInput(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch recent reports for selection:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchRecentReports();
  }, []);

  // Auto-verify if reportId is passed in URL query
  useEffect(() => {
    if (initialReportId) {
      setReportIdInput(initialReportId);
      handleVerify(initialReportId);
    }
  }, [initialReportId]);

  const handleVerify = async (idToVerify?: string) => {
    const id = idToVerify || reportIdInput.trim();
    if (!id) {
      setVerifyError('Please enter a valid Report ID.');
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const res = await apiService.verifyReportOnChain(id);
      setVerifyResult(res);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Verification query failed.';
      setVerifyError(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRegister = async () => {
    const id = reportIdInput.trim();
    if (!id) {
      setRegisterError('Please enter a valid Report ID.');
      return;
    }

    setRegisterLoading(true);
    setRegisterError(null);
    setRegisterResult(null);
    setRegisterStep(1); // Canonicalizing

    try {
      await new Promise((r) => setTimeout(r, 600));
      setRegisterStep(2); // Hashing Keccak-256

      await new Promise((r) => setTimeout(r, 600));
      setRegisterStep(3); // Submitting Transaction

      const res = await apiService.registerReportOnChain(id, reportType);

      if (res.registration_status === 'CONFIRMED') {
        setRegisterStep(5); // Confirmed
        setRegisterResult(res);
        fetchStatus(); // Refresh counters
      } else {
        setRegisterStep(0);
        setRegisterError(res.message || 'Transaction submission could not be confirmed.');
      }
    } catch (err: any) {
      setRegisterStep(0);
      const msg = err.response?.data?.detail || err.message || 'Registration transaction failed.';
      setRegisterError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-xl text-purple-700 dark:text-purple-300">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Decentralized Threat Intelligence
              </h1>
              <p className="text-sm text-slate-800 dark:text-slate-300 mt-0.5 font-medium">
                Cryptographic report provenance & independent tamper-verification on Ethereum Sepolia Testnet
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStatus}
            disabled={statusLoading}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white dark:bg-[#0D1629] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-[#1A2844] shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh State</span>
          </button>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 dark:bg-[#00D29E]/20 border border-emerald-300 dark:border-[#00D29E]/40 rounded-xl text-emerald-950 dark:text-[#00E5A3] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-[#00D29E] animate-pulse"></span>
            <span>On-Chain Registry Active</span>
          </div>
        </div>
      </div>

      {/* Educational Distinction Banner */}
      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/60 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5">
        <ShieldCheck className="h-5 w-5 text-purple-800 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          <span className="font-bold text-purple-950 dark:text-purple-300">Cryptographic Provenance Disclaimer: </span>
          Blockchain registration anchors an immutable Keccak-256 fingerprint representing the exact canonical report findings and timestamps.
          Independent verification confirms whether the current report matches what was registered earlier without alteration.
          <span className="text-purple-950 dark:text-purple-300 font-bold"> It does not independently determine whether the analyzed website was malicious.</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Card */}
        <div className="phish-card p-4">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Blockchain Network</span>
            <Cpu className="h-4 w-4 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="text-base font-extrabold text-slate-950 dark:text-white">
            {networkStatus?.network_name || 'Ethereum Sepolia'}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 flex items-center space-x-1.5 font-bold">
            <span>Chain ID:</span>
            <span className="font-mono text-slate-950 dark:text-slate-100">{networkStatus?.chain_id || 11155111}</span>
            <span className="text-slate-400">•</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
              networkStatus?.rpc_status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-950 dark:bg-[#00D29E]/20 dark:text-[#00E5A3]' : 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-300'
            }`}>
              {networkStatus?.rpc_status || 'CHECKING'}
            </span>
          </div>
        </div>

        {/* Latest Block Card */}
        <div className="phish-card p-4">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Block Height</span>
            <Database className="h-4 w-4 text-purple-700 dark:text-purple-400" />
          </div>
          <div className="text-base font-extrabold text-slate-950 dark:text-white font-mono">
            {networkStatus?.latest_block ? `#${networkStatus.latest_block.toLocaleString()}` : 'Synchronizing...'}
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-semibold">
            EVM JSON-RPC Live Feed
          </div>
        </div>

        {/* Contract Address Card */}
        <div className="phish-card p-4">
          <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>ThreatReportRegistry.sol</span>
            <Lock className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
          </div>
          <div className="text-xs font-mono text-slate-800 dark:text-slate-300 truncate">
            {networkStatus?.contract_address ? (
              <a
                href={`https://sepolia.etherscan.io/address/${networkStatus.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-800 dark:text-[#00E5A3] hover:underline flex items-center space-x-1 truncate font-bold"
              >
                <span className="truncate">{networkStatus.contract_address}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-slate-400 italic">Ready for deployment</span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Status:</span>
            <span className={networkStatus?.contract_available ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
              {networkStatus?.contract_available ? 'Active On-Chain' : 'Pending Deployment'}
            </span>
          </div>
        </div>

        {/* Total Reports Card */}
        <div className="phish-card p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>On-Chain Anchored Reports</span>
            <Hash className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {networkStatus?.total_reports_registered !== null && networkStatus?.total_reports_registered !== undefined
              ? networkStatus.total_reports_registered
              : '—'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable Keccak-256 records
          </div>
        </div>
      </div>

      {/* Main Action Console */}
      <div className="phish-card p-6">
        {/* Tab Selector */}
        <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'verify'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verify Report Integrity</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'register'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Register Report on Blockchain</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Target Report ID
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <input
                type="text"
                value={reportIdInput}
                onChange={(e) => setReportIdInput(e.target.value)}
                placeholder="Enter report UUID (e.g. c1f7a28b-9023-4e4b-97e3-0d34f0d61109)"
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
              />

              {activeTab === 'register' && (
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="URL_ANALYSIS">URL Analysis (Mod 1/2)</option>
                  <option value="MESSAGE_ANALYSIS">Message Analysis (Mod 3)</option>
                  <option value="WEBSITE_SECURITY">Website Security (Mod 5)</option>
                </select>
              )}

              {activeTab === 'verify' ? (
                <button
                  onClick={() => handleVerify()}
                  disabled={verifyLoading || !reportIdInput}
                  className="px-6 py-2.5 bg-[#047857] hover:bg-[#065f46] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  {verifyLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  <span>Verify Integrity</span>
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registerLoading || !reportIdInput}
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  {registerLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  <span>Register On-Chain</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick-Pick Recent Reports */}
          {recentReports.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Recent Investigations:</span>
              {recentReports.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setReportIdInput(r.id);
                    if (activeTab === 'verify') handleVerify(r.id);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-mono text-[11px] border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1 font-medium"
                >
                  <span>{r.domain || r.submitted_url.slice(0, 20)}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: VERIFICATION DISPLAY */}
        {activeTab === 'verify' && (
          <div className="mt-8">
            {verifyError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">Verification Query Failed</div>
                  <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-300/90">{verifyError}</div>
                </div>
              </div>
            )}

            {verifyResult && (
              <div className="space-y-6">
                {/* Result Verdict Banner */}
                {verifyResult.verification_status === 'VERIFIED' && (
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-4">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-lg font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-2">
                        <span>REPORT INTEGRITY VERIFIED</span>
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-full font-mono font-semibold">
                          MATCH 100%
                        </span>
                      </div>
                      <p className="text-sm text-emerald-800 dark:text-emerald-200/90 mt-1 font-medium">
                        The current report data matches the original Keccak-256 fingerprint registered on the Ethereum blockchain.
                        This report is authentic and has not been altered since on-chain registration.
                      </p>
                    </div>
                  </div>
                )}

                {verifyResult.verification_status === 'TAMPERED' && (
                  <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-4">
                    <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-lg font-bold text-rose-900 dark:text-rose-300 flex items-center space-x-2">
                        <span>SECURITY ALERT: REPORT TAMPERED</span>
                        <span className="text-xs px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 rounded-full font-mono font-semibold">
                          HASH MISMATCH
                        </span>
                      </div>
                      <p className="text-sm text-rose-800 dark:text-rose-200/90 mt-1 font-medium">
                        A registered record exists for this report ID, but the recalculated Keccak-256 fingerprint does NOT match the on-chain fingerprint.
                        Findings or risk scores have been modified after registration.
                      </p>
                    </div>
                  </div>
                )}

                {verifyResult.verification_status === 'NOT_REGISTERED' && (
                  <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-4">
                    <HelpCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-lg font-bold text-amber-900 dark:text-amber-300">
                        NOT REGISTERED ON BLOCKCHAIN
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-200/90 mt-1 font-medium">
                        No cryptographic fingerprint for this report was found on the ThreatReportRegistry smart contract.
                        You can anchor it now by clicking the &quot;Register Report on Blockchain&quot; tab.
                      </p>
                    </div>
                  </div>
                )}

                {verifyResult.verification_status === 'UNAVAILABLE' && (
                  <div className="p-5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start space-x-4">
                    <AlertTriangle className="h-6 w-6 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        BLOCKCHAIN SERVICE TEMPORARILY UNAVAILABLE
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        The Sepolia EVM JSON-RPC endpoint or registry contract could not be queried.
                        Please ensure an active network connection or verify local RPC settings.
                      </p>
                    </div>
                  </div>
                )}

                {/* Fingerprint & Cryptographic Details Matrix */}
                <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Cryptographic Fingerprint Comparison</span>
                  </h3>

                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <div className="text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between font-medium">
                        <span>Current Calculated Hash (Keccak-256):</span>
                        <button
                          onClick={() => copyToClipboard(verifyResult.current_report_hash, 'curr')}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 font-semibold"
                        >
                          {copiedKey === 'curr' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedKey === 'curr' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-emerald-800 dark:text-emerald-400 break-all select-all font-semibold">
                        {verifyResult.current_report_hash}
                      </div>
                    </div>

                    {verifyResult.registered_report_hash && (
                      <div>
                        <div className="text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between font-medium">
                          <span>Original On-Chain Hash:</span>
                          <button
                            onClick={() => copyToClipboard(verifyResult.registered_report_hash || '', 'orig')}
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 font-semibold"
                          >
                            {copiedKey === 'orig' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedKey === 'orig' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-purple-800 dark:text-purple-400 break-all select-all font-semibold">
                          {verifyResult.registered_report_hash}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Network:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{verifyResult.network}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Registration Timestamp:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">
                        {verifyResult.timestamp
                          ? new Date(verifyResult.timestamp * 1000).toUTCString()
                          : 'Not recorded'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Submitter Address:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-mono truncate block font-semibold">
                        {verifyResult.submitter || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {verifyResult.transaction_hash && (
                    <div className="pt-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${verifyResult.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs text-purple-700 dark:text-purple-400 hover:underline font-semibold"
                      >
                        <span>View Transaction on Sepolia Etherscan</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTRATION PROGRESS & CONFIRMATION */}
        {activeTab === 'register' && (
          <div className="mt-8 space-y-6">
            {registerLoading && (
              <div className="p-5 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span>Registering Threat Report on Ethereum Sepolia</span>
                  <span className="text-purple-700 dark:text-purple-400 font-mono font-bold">Step {registerStep} of 4</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-semibold">
                  <div className={`p-2.5 rounded-lg border ${registerStep >= 1 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                    1. Canonicalizing
                  </div>
                  <div className={`p-2.5 rounded-lg border ${registerStep >= 2 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                    2. Keccak-256 Hashing
                  </div>
                  <div className={`p-2.5 rounded-lg border ${registerStep >= 3 ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                    3. Signing & Broadcast
                  </div>
                  <div className={`p-2.5 rounded-lg border ${registerStep >= 5 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>
                    4. Block Confirmation
                  </div>
                </div>
              </div>
            )}

            {registerError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">Registration Failed</div>
                  <div className="mt-0.5 text-xs text-rose-700 dark:text-rose-300/90">{registerError}</div>
                </div>
              </div>
            )}

            {registerResult && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-4">
                <div className="flex items-start space-x-3.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                      Threat Report Registered On-Chain!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-200/90 mt-0.5 font-medium">
                      {registerResult.message}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Report Keccak-256 Fingerprint:</span>
                    <span className="text-emerald-800 dark:text-emerald-400 break-all select-all font-mono font-bold">
                      {registerResult.report_hash}
                    </span>
                  </div>

                  {registerResult.transaction_hash && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Transaction Hash:</span>
                      <a
                        href={registerResult.explorer_url || `https://sepolia.etherscan.io/tx/${registerResult.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 dark:text-purple-400 hover:underline break-all select-all flex items-center space-x-1 font-bold"
                      >
                        <span>{registerResult.transaction_hash}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Block Number:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{registerResult.block_number || 'Confirmed'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block font-medium">Network:</span>
                      <span className="text-slate-900 dark:text-slate-200 font-semibold">{registerResult.network}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent On-Chain Registrations Feed */}
      {networkStatus?.recent_registrations && networkStatus.recent_registrations.length > 0 && (
        <div className="phish-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-700 dark:text-purple-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent On-Chain Registered Fingerprints</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live Smart Contract Events</span>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="min-w-[620px] w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-left font-semibold">
                  <th className="py-2.5 px-3">Report Fingerprint (Keccak-256)</th>
                  <th className="py-2.5 px-3">Submitter Address</th>
                  <th className="py-2.5 px-3">Registration Time</th>
                  <th className="py-2.5 px-3 text-right">Etherscan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {networkStatus.recent_registrations.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-emerald-800 dark:text-emerald-400 truncate max-w-xs font-semibold">
                      {item.report_hash}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                      {item.submitter}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {new Date(item.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`https://sepolia.etherscan.io/search?q=${item.report_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center space-x-1 font-semibold"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainRegistryPage;
