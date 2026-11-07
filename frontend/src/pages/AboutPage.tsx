import React from 'react';
import {
  Shield,
  Cpu,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  Terminal,
  Compass
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
          <span>Project Whitepaper & Architectural Overview</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          AI-Powered Web Threat Detection & Digital Trust Intelligence
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          A multi-layered cybersecurity intelligence platform designed for a 48-hour hackathon to help
          individuals and organisations detect malicious links, brand impersonation campaigns, fraudulent
          payment gates, and digital deception before becoming victims.
        </p>
      </div>

      {/* 3 Converging Domains */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Domain 1: AI */}
        <div className="cyber-card p-6 border-blue-900/40 bg-blue-950/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Artificial Intelligence</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Acts as an evidence synthesizer and explainability layer. Translates complex cybersecurity
            telemetry (DNS zone anomalies, redirect hops, brand distance) into human-readable narratives
            and actionable user recommendations, guarded strictly against prompt injection.
          </p>
        </div>

        {/* Domain 2: Cybersecurity */}
        <div className="cyber-card p-6 border-emerald-900/40 bg-emerald-950/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Cybersecurity Engineering</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Powers the deterministic detection core: RFC-compliant URL normalization, Levenshtein
            brand typosquatting detection, Punycode homograph decoding, asynchronous DNS zone audits,
            and strict Server-Side Request Forgery (SSRF) protection against private IPs.
          </p>
        </div>

        {/* Domain 3: Web3 */}
        <div className="cyber-card p-6 border-purple-900/40 bg-purple-950/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-base font-semibold text-white">Web3 & Trust Registry</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Provides the architectural foundation for tamper-evident, decentralized threat intelligence.
            Cryptographic report hashes committed on-chain establish verifiable provenance and prevent
            silent modification of incident records across distributed organizations.
          </p>
        </div>
      </div>

      {/* Module 1: Implementation Status */}
      <div className="cyber-card p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-4 h-4" /> Fully Implemented & Verified
            </div>
            <h2 className="text-xl font-bold text-white">
              MODULE 1: Intelligent URL and Website Analysis
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Production Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 1. URL Validation & Normalization
            </span>
            <p className="text-slate-400 leading-relaxed">
              Whitelists HTTP/HTTPS protocols, rejects dangerous schemes (javascript:, file:, ftp:),
              normalizes ports and dot-segments, and enforces strict hostname RFC 1123 compliance.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 2. Domain & Homoglyph Engine
            </span>
            <p className="text-slate-400 leading-relaxed">
              Extracts subdomains, registered domain, and TLD using tldextract. Detects Punycode (xn--)
              and flags Cyrillic homoglyph lookalikes designed to deceive human eyes.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 3. Brand Typosquatting Detection
            </span>
            <p className="text-slate-400 leading-relaxed">
              Audits domain similarity against high-value target brands (PayPal, Apple, Microsoft,
              Meta, Binance, MetaMask, Chase). Differentiates official domains from phishing lookalikes.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 4. DNS Hierarchy Analysis
            </span>
            <p className="text-slate-400 leading-relaxed">
              Asynchronously retrieves A, AAAA, MX, NS, and TXT records. Unreachable servers are
              classified as UNAVAILABLE or UNKNOWN rather than as false proof of maliciousness.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 5. Safe Redirect & SSRF Shield
            </span>
            <p className="text-slate-400 leading-relaxed">
              Follows HTTP redirect chains step-by-step. Resolves destination IPs before connecting and
              aborts on private, loopback, or cloud-metadata IPs (169.254.169.254).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-cyber-950/80 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> 6. Explainable Risk Engine
            </span>
            <p className="text-slate-400 leading-relaxed">
              Rule-based scoring system with configurable weights and saturation caps. Classifies into
              LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, and INCONCLUSIVE.
            </p>
          </div>
        </div>
      </div>

      {/* Future Roadmap Modules */}
      <div className="cyber-card p-6 md:p-8 space-y-6">
        <div>
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            System Expansion Roadmap
          </span>
          <h2 className="text-xl font-bold text-white">Future Security Modules (Architecture Ready)</h2>
          <p className="text-xs text-slate-400 mt-1">
            The platform architecture has been decoupled to allow seamless integration of subsequent modules:
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-cyber-950/60 border border-slate-800 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 shrink-0 mt-0.5">
              MODULE 2
            </span>
            <div>
              <span className="text-sm font-semibold text-white block">TLS Certificate & Web Trust Analysis</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Will inspect HTTPS configurations, public key strength, Certificate Authority trust chains,
                Certificate Transparency logs, and detect distrusted/compromised CAs (e.g., eMudhra-style incidents).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyber-950/60 border border-slate-800 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 shrink-0 mt-0.5">
              MODULE 3
            </span>
            <div>
              <span className="text-sm font-semibold text-white block">AI-Powered Scam & Message Analysis</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Will accept pasted phishing SMS, scam emails, and job offer messages to detect social
                engineering manipulation, urgency tactics, fake recruiter identities, and extracted malicious URLs.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyber-950/60 border border-slate-800 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 shrink-0 mt-0.5">
              MODULE 4
            </span>
            <div>
              <span className="text-sm font-semibold text-white block">Intelligent Threat Correlation</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Will correlate submitted indicators across multiple reports to cluster phishing campaigns,
                track reused hosting infrastructure, and discover coordinated fraud networks.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyber-950/60 border border-slate-800 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 shrink-0 mt-0.5">
              MODULE 5
            </span>
            <div>
              <span className="text-sm font-semibold text-white block">Passive Website Security Assessment</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Non-intrusive scanning of HTTP security headers (CSP, HSTS, X-Frame-Options), cookie flags,
                and outdated public software versions on authorized target domains.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyber-950/60 border border-slate-800 flex items-start gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-300 shrink-0 mt-0.5">
              MODULE 6
            </span>
            <div>
              <span className="text-sm font-semibold text-white block">Decentralized Threat Intelligence (Web3)</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Smart-contract registry on EVM testnet recording cryptographic commitments of validated threat
                reports for tamper-evident provenance and collaborative decentralized verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Principles and Security Boundaries */}
      <div className="cyber-card p-6 md:p-8 space-y-4 bg-slate-900/40">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Core Operational Security Principles</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-white">Absence of evidence is not evidence of absence:</strong> A clean
            external reputation or valid HTTPS connection does not guarantee that a new zero-day link is safe.
          </li>
          <li>
            <strong className="text-white">Strict SSRF isolation:</strong> Automated inspectors never touch
            internal loopback (127.0.0.1) or cloud metadata endpoints (169.254.169.254).
          </li>
          <li>
            <strong className="text-white">Untrusted input boundaries:</strong> Web URLs and HTML payloads
            are treated strictly as untrusted data; prompt injection cannot override scoring weights.
          </li>
          <li>
            <strong className="text-white">Non-intrusive auditing:</strong> No exploitation, no arbitrary
            script execution, and no malware downloads are ever performed.
          </li>
        </ul>
      </div>
    </div>
  );
};

