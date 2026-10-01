const fs = require('fs');
const files = [
  'src/routes/_app.arrival-report.tsx',
  'src/routes/_app.challan-note.tsx',
  'src/routes/_app.money-receipt.tsx',
  'src/routes/_app.voucher-entry.tsx',
  'src/routes/_app.billing.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  const startIndex = content.indexOf('{/* ── COMPANY HEADER BANNER ── */}');
  if (startIndex === -1) return;

  // The banner ends with </div>\n`; (since I inserted it like that)
  // Let's find the first `<div` after the banner start, and then find its matching `</div>`
  // Actually, I can just use a regex or string replacement since I know the exact string.

  const bannerStr = `
      {/* ── COMPANY HEADER BANNER ── */}
      <div className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 print:hidden mb-6">
        <img
          src="/logo.png"
          alt="JRKS Logo"
          className="h-32 w-32 object-contain flex-shrink-0"
          style={{ clipPath: "inset(2px 0 0 0)" }}
        />
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A]">
            JRKS DIGITAL INDIA LOGISTICS LLP
          </h2>
          <p className="text-xs font-bold text-blue-600 leading-none">
            (Transport Contractor & Logistics Solutions)
          </p>
          <p className="text-xs font-semibold text-slate-500 leading-tight mt-1.5 whitespace-nowrap">
            No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post),
            Trichy - 620 019.
          </p>
          <p className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 leading-tight mt-1.5 flex-wrap">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Office: 0431-4518283
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-green-500"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg> WhatsApp: +91 97906 05938
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-blue-400"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> Contact: +91 93645 95075
            </span>
          </p>
        </div>
      </div>\n`;

  // My script did: "\n" + bannerStr. Let's just do a simple replacement of "\n" + bannerStr with ""
  content = content.replace("\n" + bannerStr, "");
  // just in case
  content = content.replace(bannerStr, "");

  fs.writeFileSync(f, content);
  console.log('Fixed ' + f);
});
