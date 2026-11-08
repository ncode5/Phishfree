import React from 'react';
import { TlsTrustCard } from '../components/dashboard/TlsTrustCard';

export const CertificateTrustPage: React.FC = () => {
  const recentCerts = [
    { target: 'auth1-sync.example', issuer: 'Let\'s Encrypt Authority X3', status: 'SAN Mismatch', expires: '28 days', risk: 'High' },
    { target: 'account-verify.example', issuer: 'ZeroSSL RSA Domain CA', status: 'CT Lookup Unavailable', expires: '84 days', risk: 'Medium' },
    { target: 'docs.acme.example', issuer: 'DigiCert Global Root G2', status: 'Valid EV TLS', expires: '420 days', risk: 'Safe' },
    { target: 'secure-portal.example', issuer: 'Sectigo RSA Domain Validation', status: 'Chain Incomplete', expires: '12 days', risk: 'Medium' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          TLS & Certificate Trust
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Cryptographic auditing, Certificate Transparency (CT) log checks, and cipher strength metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <TlsTrustCard />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent TLS Certificate Audits
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">TARGET HOST</th>
                  <th className="py-2.5 px-3">ISSUER</th>
                  <th className="py-2.5 px-3">AUDIT STATUS</th>
                  <th className="py-2.5 px-3">VALIDITY</th>
                  <th className="py-2.5 px-3">RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentCerts.map((c) => (
                  <tr key={c.target} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{c.target}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{c.issuer}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.status}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">{c.expires}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.risk === 'High' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' :
                        c.risk === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {c.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
