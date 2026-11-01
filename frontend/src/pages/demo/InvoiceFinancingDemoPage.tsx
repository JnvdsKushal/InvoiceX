import { useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Banknote, CheckCircle2, ChevronRight, Clock3, Copy, FileCheck2, FilePlus2, Fingerprint, Landmark, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type Stage = "draft" | "hashed" | "verified" | "funded";
type LedgerEvent = { label: string; detail: string; hash: string; previousHash: string; time: string };
const offers = [
  { id: "OFFER-AX19", lender: "Apex Capital", advance: 90, fee: 1.8, rate: 12, days: 60, color: "cyan" },
  { id: "OFFER-NB42", lender: "NorthBridge Finance", advance: 85, fee: 1.4, rate: 13.5, days: 75, color: "violet" },
  { id: "OFFER-PR07", lender: "Prime MSME Fund", advance: 88, fee: 2.1, rate: 11.5, days: 45, color: "emerald" },
];
const short = (value: string) => value ? value.slice(0, 18) + "..." + value.slice(-10) : "—";
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}
function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}
function Step({ number, label, active, complete }: { number: string; label: string; active: boolean; complete: boolean }) {
  return <div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${complete ? "bg-emerald-100 text-emerald-700" : active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-400"}`}>{complete ? <CheckCircle2 size={18}/> : number}</div><span className={`text-sm font-semibold ${active || complete ? "text-slate-900" : "text-slate-400"}`}>{label}</span></div>;
}
export default function InvoiceFinancingDemoPage() {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-2026-1042");
  const [supplier, setSupplier] = useState("Kushal Industrial Components");
  const [buyer, setBuyer] = useState("AeroParts Manufacturing Ltd.");
  const [amount, setAmount] = useState("500000");
  const [dueDate, setDueDate] = useState("2026-12-15");
  const [description, setDescription] = useState("Aircraft-grade aluminium component supply");
  const [stage, setStage] = useState<Stage>("draft");
  const [invoiceHash, setInvoiceHash] = useState("");
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const numericAmount = Math.max(0, Number(amount) || 0);
  const selected = offers.find(offer => offer.id === selectedOffer);
  const receiveAmount = selected ? Math.round(numericAmount * selected.advance / 100 * (1 - selected.fee / 100)) : 0;
  const canHash = invoiceNumber.trim() && supplier.trim() && buyer.trim() && numericAmount > 0 && dueDate;
  const progress = stage === "draft" ? 0 : stage === "hashed" ? 1 : stage === "verified" ? 2 : 3;
  const stageLabel = useMemo(() => ({ draft: "Invoice prepared", hashed: "Hash created", verified: "Integrity verified", funded: "Demo funding completed" }[stage]), [stage]);
  async function addLedgerEvent(label: string, detail: string, payload: string) {
    const previousHash = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
    const time = new Date().toISOString();
    const hash = await sha256(JSON.stringify({ sequence: ledger.length + 1, label, detail, payload, previousHash, time }));
    setLedger(current => [...current, { label, detail, hash, previousHash, time }]);
  }
  async function createHash() {
    if (!canHash) return;
    setBusy(true); setError(""); setVerified(false); setSelectedOffer(""); setLedger([]);
    try {
      const canonicalInvoice = { invoiceNumber: invoiceNumber.trim(), supplier: supplier.trim(), buyer: buyer.trim(), amount: numericAmount.toFixed(2), currency: "INR", dueDate, description: description.trim() };
      const hash = await sha256(JSON.stringify(canonicalInvoice));
      setInvoiceHash(hash);
      await addLedgerEvent("INVOICE_CREATED", "Canonical invoice data hashed using SHA-256", hash);
      setStage("hashed");
    } catch {
      setError("Your browser could not generate a SHA-256 digest. Please use a modern browser on localhost or HTTPS.");
    } finally { setBusy(false); }
  }
  async function verifyHash() {
    setBusy(true); setError("");
    try {
      const canonicalInvoice = { invoiceNumber: invoiceNumber.trim(), supplier: supplier.trim(), buyer: buyer.trim(), amount: numericAmount.toFixed(2), currency: "INR", dueDate, description: description.trim() };
      const recalculated = await sha256(JSON.stringify(canonicalInvoice));
      const valid = recalculated === invoiceHash;
      setVerified(valid);
      if (valid) {
        await addLedgerEvent("INVOICE_HASH_VERIFIED", "Recalculated SHA-256 matches the stored invoice digest", recalculated);
        setStage("verified");
      } else {
        setError("Hash mismatch: invoice data changed after the original digest was created. Create a new hash before proceeding.");
      }
    } catch { setError("Verification failed in this browser."); }
    finally { setBusy(false); }
  }
  async function acceptOffer() {
    if (!selected) return;
    setBusy(true);
    await addLedgerEvent("FINANCING_OFFER_ACCEPTED", `${selected.lender} · ${selected.advance}% advance · ${selected.fee}% fee`, selected.id);
    await addLedgerEvent("DEMO_DISBURSEMENT_RECORDED", `Simulated net proceeds: ${receiveAmount} INR`, selected.id);
    setStage("funded"); setBusy(false);
  }
  async function copyHash() {
    await navigator.clipboard.writeText(invoiceHash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  function reset() { setStage("draft"); setInvoiceHash(""); setLedger([]); setSelectedOffer(""); setVerified(false); setError(""); }
  return <div className="min-h-screen bg-[#f5f8fc] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-cyan-300"><Fingerprint size={22}/></div><div><p className="text-xl font-black tracking-tight">Invoice<span className="text-cyan-600">X</span></p><p className="text-xs text-slate-500">Invoice identity · Verification · Financing</p></div></div>
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-800"><Sparkles size={14}/> JURY DEMO · SIMULATION MODE</div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-cyan-700">Live product walkthrough</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">From invoice to instant financing.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create a unique invoice fingerprint, verify its integrity, then explore financing offers against the verified invoice.</p></div><button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16}/>Reset demo</button></div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><strong>Demo disclosure:</strong> SHA-256 hashes are generated in your browser. Ledger entries, lender offers and disbursement are simulated locally for presentation; this screen does not write to the production blockchain, call a lender, or transfer real money.</div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-4 sm:grid-cols-4"><Step number="01" label="Create invoice" active={progress===0} complete={progress>0}/><div className="hidden items-center sm:flex"><div className="h-px w-full bg-slate-200"/></div><Step number="02" label="Generate hash" active={progress===1} complete={progress>1}/><div className="hidden items-center sm:flex"><div className="h-px w-full bg-slate-200"/></div><Step number="03" label="Verify integrity" active={progress===2} complete={progress>2}/><div className="hidden items-center sm:flex"><div className="h-px w-full bg-slate-200"/></div><Step number="04" label="Get financing" active={progress===3} complete={progress===3}/></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600 transition-all" style={{width:`${(progress/3)*100}%`}}/></div></div>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><FilePlus2 size={21}/></div><div><h2 className="font-bold">1. Invoice identity</h2><p className="text-xs text-slate-500">Invoice details used to create the fingerprint</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">INR · Digital record</span></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Invoice number<input value={invoiceNumber} onChange={e=>{setInvoiceNumber(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
            <label className="text-sm font-semibold text-slate-700">Invoice amount (₹)<input type="number" min="1" value={amount} onChange={e=>{setAmount(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
            <label className="text-sm font-semibold text-slate-700">Supplier / MSME<input value={supplier} onChange={e=>{setSupplier(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
            <label className="text-sm font-semibold text-slate-700">Buyer organization<input value={buyer} onChange={e=>{setBuyer(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
            <label className="text-sm font-semibold text-slate-700">Due date<input type="date" value={dueDate} onChange={e=>{setDueDate(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Goods / service description<input value={description} onChange={e=>{setDescription(e.target.value);if(stage!=="draft")reset();}} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-cyan-500"/></label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="text-xs text-slate-500">Invoice face value</p><p className="text-2xl font-black">{money(numericAmount)}</p></div><button disabled={!canHash || busy || stage!=="draft"} onClick={()=>void createHash()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Fingerprint size={17}/>{busy?"Processing...":"Generate SHA-256 hash"}<ArrowRight size={16}/></button></div>
          {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Fingerprint size={21}/></div><div><h2 className="font-bold">2. Invoice fingerprint</h2><p className="text-xs text-slate-500">SHA-256 · 256-bit digest</p></div></div>
            {invoiceHash ? <><div className="mt-5 break-all rounded-xl border border-violet-100 bg-violet-50 p-4 font-mono text-xs leading-6 text-violet-900">{invoiceHash}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">64 hexadecimal characters · 32 bytes</span><button onClick={()=>void copyHash()} className="inline-flex items-center gap-2 text-xs font-bold text-violet-700"><Copy size={14}/>{copied?"Copied":"Copy hash"}</button></div></> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Fingerprint size={30} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-600">Your invoice hash will appear here</p><p className="mt-1 text-xs text-slate-400">Create the invoice fingerprint to continue</p></div>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={21}/></div><div><h2 className="font-bold">3. Integrity verification</h2><p className="text-xs text-slate-500">Recompute and compare invoice fingerprint</p></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="text-sm font-semibold">Hash match status</p><p className="mt-1 text-xs text-slate-500">{verified?"Recalculated digest matches stored digest":"Waiting for verification"}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${verified?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-500"}`}>{verified?"VERIFIED":"NOT VERIFIED"}</span></div><button disabled={!invoiceHash || busy || verified} onClick={()=>void verifyHash()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"><BadgeCheck size={17}/>{busy?"Verifying...":"Verify invoice hash"}</button></div>
        </section>
      </div>
      {stage==="verified" || stage==="funded" ? <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-700">4. Financing marketplace</p><h2 className="mt-1 text-2xl font-black">Verified invoice. Financing unlocked.</h2><p className="mt-1 text-sm text-slate-500">Illustrative offers generated for this jury walkthrough.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800"><LockKeyhole size={14}/> Hash verified</span></div><div className="grid gap-5 lg:grid-cols-3">{offers.map(offer=>{const advanceAmount=numericAmount*offer.advance/100;const net=Math.round(advanceAmount*(1-offer.fee/100));return <div key={offer.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${selectedOffer===offer.id?"border-cyan-500 ring-2 ring-cyan-100":"border-slate-200"}`}><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Landmark size={21}/></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">DEMO OFFER</span></div><h3 className="mt-4 text-lg font-bold">{offer.lender}</h3><p className="text-xs text-slate-500">{offer.id}</p><div className="mt-5 border-y border-slate-100 py-4"><p className="text-xs text-slate-500">Illustrative net amount to supplier</p><p className="mt-1 text-2xl font-black text-slate-900">{money(net)}</p><p className="mt-1 text-xs text-slate-500">{offer.advance}% advance · {offer.fee}% processing fee</p></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Indicative APR</p><p className="mt-1 font-bold">{offer.rate}%</p></div><div><p className="text-xs text-slate-500">Tenor</p><p className="mt-1 font-bold">{offer.days} days</p></div></div><button disabled={stage==="funded" || busy} onClick={()=>setSelectedOffer(offer.id)} className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold ${selectedOffer===offer.id?"bg-cyan-700 text-white":"border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>{selectedOffer===offer.id?"Selected offer":"Select this offer"}</button></div>})}</div>{selected && <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5"><div><p className="text-sm font-bold text-cyan-950">Ready to simulate offer acceptance</p><p className="mt-1 text-sm text-cyan-900">{selected.lender} · estimated proceeds {money(receiveAmount)}</p></div><button disabled={busy || stage==="funded"} onClick={()=>void acceptOffer()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50"><Banknote size={17}/>{busy?"Recording...":"Accept & simulate funding"}<ChevronRight size={16}/></button></div>}</section> : null}
      {stage==="funded" && selected && <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={28}/></div><div><p className="text-sm font-bold uppercase tracking-wider text-emerald-700">Demo funding complete</p><h2 className="mt-1 text-2xl font-black">{money(receiveAmount)} net proceeds simulated</h2><p className="mt-1 text-sm text-slate-500">Offer accepted and demo disbursement event added to the local hash-linked event trail.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Invoice value</p><p className="mt-1 font-bold">{money(numericAmount)}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Advance before fee</p><p className="mt-1 font-bold">{money(numericAmount*selected.advance/100)}</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Net proceeds (simulated)</p><p className="mt-1 font-bold text-emerald-800">{money(receiveAmount)}</p></div></div></section>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck className="text-cyan-700" size={20}/><h2 className="font-bold">Tamper-evident event trail</h2></div><p className="mt-1 text-xs text-slate-500">Each demo event includes its previous event hash and its own SHA-256 digest.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{ledger.length} events</span></div>{ledger.length ? <div className="mt-5 space-y-0">{ledger.map((event,index)=><div key={event.hash} className="relative flex gap-4 pb-6 last:pb-0"><div className="flex flex-col items-center"><div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700"><FileCheck2 size={17}/></div>{index!==ledger.length-1 && <div className="absolute bottom-0 top-9 w-px bg-cyan-200"/>}</div><div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{event.label.replaceAll("_"," ")}</p><span className="text-xs text-slate-400">{new Date(event.time).toLocaleTimeString()}</span></div><p className="mt-1 text-xs text-slate-500">{event.detail}</p><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><p className="text-slate-400">Previous hash</p><p className="mt-1 break-all font-mono text-slate-600">{short(event.previousHash)}</p></div><div><p className="text-slate-400">Event hash</p><p className="mt-1 break-all font-mono text-cyan-800">{short(event.hash)}</p></div></div></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center"><Clock3 className="mx-auto text-slate-300" size={25}/><p className="mt-2 text-sm font-semibold text-slate-600">No ledger events yet</p><p className="mt-1 text-xs text-slate-400">Generate the invoice hash to begin the event trail.</p></div>}</section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-500"><span>InvoiceX · Jury demonstration build</span><span>SHA-256 · Hash-linked demo events · Simulated financing</span></footer>
    </main>
  </div>;
}
