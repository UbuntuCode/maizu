"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/navigation/BottomNav";
import { useAuth } from "@/context/AuthContext";

const P     = "#E8401C";
const DARK  = "#0F0F0F";
const MUTED = "#71717A";
const WHITE = "#FFFFFF";
const BORDER= "#E4E4E7";

const BENEFITS = [
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, title:"Your own online store", desc:"Set up in under 10 minutes. Add products, photos and prices â€” no technical skills needed." },
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title:"Accept card payments", desc:"Visa, Mastercard, EFT and cash on delivery. Money settles to your bank in 2 business days." },
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, title:"Track your sales", desc:"Real-time analytics showing revenue, top products and order trends from your dashboard." },
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title:"WhatsApp sharing built in", desc:"Share your store and products to WhatsApp with one tap â€” reach buyers in your contacts." },
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>, title:"Video showcase", desc:"Post product videos on the Discover feed. Buyers scroll through and shop directly." },
  { icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="18" x2="12" y2="6"/></svg>, title:"Boost your store", desc:"Pay a small fee to appear at the top. More visibility means more sales." },
];

const PLANS = [
  { name:"Free",  price:"R0",   period:"forever", color:MUTED,     features:["1 store","10 products","5% commission","Basic analytics"], cta:"Start for free",  highlight:false },
  { name:"Basic", price:"R99",  period:"/month",  color:"#2563EB", features:["3 stores","50 products","3% commission","Full analytics","Promo codes"], cta:"Start selling more", highlight:true, badge:"Most popular" },
  { name:"Pro",   price:"R299", period:"/month",  color:P,         features:["Unlimited stores","Unlimited products","1% commission","Featured placement","Priority support"], cta:"Go unlimited", highlight:false },
];

const FAQS = [
  { q:"How long does setup take?",         a:"Most vendors have their first product listed in 15 minutes. Register, create a store, add products, share the link." },
  { q:"What can I sell?",                  a:"Anything legal â€” clothing, food, beauty, electronics, handmade crafts, services, art. If you make it or sell it, list it." },
  { q:"Do I need a registered business?",  a:"No. Individuals, sole traders and registered businesses are all welcome." },
  { q:"How does the 5% commission work?",  a:"On the Free plan we take 5% per sale. Sell a R200 item â€” you keep R190. Upgrade to Basic or Pro for lower commission." },
  { q:"How do I get paid?",                a:"Card and EFT payments settle to your bank account within 2 business days. Cash on delivery is paid directly by the buyer." },
];

function FAQItem({ q, a }: { q:string; a:string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:`1px solid ${BORDER}` }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:600, color:DARK, lineHeight:1.4, flex:1, paddingRight:12 }}>{q}</span>
        <span style={{ fontSize:20, color:P, transform:open?"rotate(45deg)":"none", transition:"transform 0.2s", flexShrink:0 }}>+</span>
      </button>
      {open && <div style={{ fontSize:13, color:MUTED, lineHeight:1.7, paddingBottom:14 }}>{a}</div>}
    </div>
  );
}

export default function SellPage() {
  const router = useRouter(); const { isLoggedIn } = useAuth();

  return (
    <div style={{ background:WHITE, minHeight:"100vh", paddingBottom:80 }}>
      <Header />

      {/* Hero */}
      <div style={{ background:`linear-gradient(160deg,${DARK} 0%,#2A1200 100%)`, padding:"44px 20px 52px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:"50%", background:`${P}18` }} />
        <div style={{ position:"absolute", bottom:-40, left:-40, width:150, height:150, borderRadius:"50%", background:`${P}12` }} />
        <div style={{ position:"relative" }}>
          <div style={{ background:`${P}22`, border:`1px solid ${P}44`, borderRadius:20, padding:"4px 14px", fontSize:11, fontWeight:700, color:P, display:"inline-block", marginBottom:16, letterSpacing:"0.05em" }}>
            BUILT FOR SOUTH AFRICA
          </div>
          <h1 style={{ fontSize:30, fontWeight:900, color:WHITE, marginBottom:12, lineHeight:1.2 }}>
            Sell anything.<br/>Get paid fast.<br/><span style={{ color:P }}>Keep more money.</span>
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.7)", marginBottom:28, lineHeight:1.7, maxWidth:320, margin:"0 auto 28px" }}>
            Open your own online store on Maizu in 10 minutes. Accept card payments, track orders and grow your business â€” all from your phone.
          </p>
          <button onClick={() => router.push(isLoggedIn ? "/become-vendor" : "/register?next=/become-vendor")} style={{ background:P, color:WHITE, border:"none", borderRadius:28, padding:"15px 32px", fontSize:16, fontWeight:800, cursor:"pointer", boxShadow:`0 8px 24px ${P}55` }}>
            Open Your Free Store
          </button>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:12 }}>No monthly fee Â· No credit card needed</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:"#FFF3EF", padding:"16px 20px", display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
        {[{val:"Free",label:"to get started"},{val:"5%",label:"commission only"},{val:"48h",label:"payment settlement"},{val:"ZAR",label:"South Africa only"}].map(s => (
          <div key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, fontWeight:900, color:P }}>{s.val}</div>
            <div style={{ fontSize:10, color:MUTED }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div style={{ padding:"32px 20px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:P, letterSpacing:"0.08em", textAlign:"center", marginBottom:8 }}>WHY MAIZU</div>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, textAlign:"center", marginBottom:24 }}>Everything you need to sell</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {BENEFITS.map(b => (
            <div key={b.title} style={{ background:"#F9FAFB", borderRadius:14, padding:"16px", display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#FFF3EF", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{b.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:DARK, marginBottom:4 }}>{b.title}</div>
                <div style={{ fontSize:12, color:MUTED, lineHeight:1.6 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background:"#F9FAFB", padding:"32px 20px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:P, letterSpacing:"0.08em", textAlign:"center", marginBottom:8 }}>HOW IT WORKS</div>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, textAlign:"center", marginBottom:28 }}>Start in 3 steps</h2>
        {[
          { n:"1", title:"Create your free account",  desc:"Register in 2 minutes. No documents needed.", time:"2 min" },
          { n:"2", title:"Open your store",           desc:"Name it, pick a category, upload a logo. Live immediately.", time:"5 min" },
          { n:"3", title:"Add your products",         desc:"Upload photos, set prices, share to WhatsApp.", time:"3 min" },
        ].map((s, i) => (
          <div key={s.n} style={{ display:"flex", gap:16, position:"relative" }}>
            {i < 2 && <div style={{ position:"absolute", left:19, top:44, bottom:-10, width:2, background:BORDER }} />}
            <div style={{ width:40, height:40, borderRadius:"50%", background:P, color:WHITE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, flexShrink:0, zIndex:1 }}>{s.n}</div>
            <div style={{ paddingBottom:28 }}>
              <div style={{ fontSize:15, fontWeight:700, color:DARK, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:12, color:MUTED, lineHeight:1.6, marginBottom:6 }}>{s.desc}</div>
              <span style={{ background:"#FFF3EF", color:P, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700 }}>{s.time}</span>
            </div>
          </div>
        ))}
        <button onClick={() => router.push(isLoggedIn ? "/become-vendor" : "/register?next=/become-vendor")} style={{ width:"100%", background:P, color:WHITE, border:"none", borderRadius:14, padding:"14px 0", fontSize:15, fontWeight:700, cursor:"pointer", marginTop:8 }}>
          Start in 10 Minutes
        </button>
      </div>

      {/* Pricing */}
      <div style={{ padding:"32px 20px" }}>
        <div style={{ fontSize:11, fontWeight:700, color:P, letterSpacing:"0.08em", textAlign:"center", marginBottom:8 }}>PRICING</div>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, textAlign:"center", marginBottom:6 }}>Simple, honest pricing</h2>
        <p style={{ fontSize:13, color:MUTED, textAlign:"center", marginBottom:24 }}>Start free. Upgrade when your business grows.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ background:WHITE, borderRadius:16, padding:"18px", border:`${plan.highlight?"2.5":"1"}px solid ${plan.highlight?plan.color:BORDER}`, position:"relative" }}>
              {plan.badge && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:plan.color, color:WHITE, borderRadius:20, padding:"2px 14px", fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>{plan.badge}</div>}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:17, fontWeight:800, color:plan.color }}>{plan.name}</div>
                <div><span style={{ fontSize:22, fontWeight:900, color:DARK }}>{plan.price}</span><span style={{ fontSize:12, color:MUTED }}>{plan.period}</span></div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
                {plan.features.map(f => <div key={f} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:DARK }}><span style={{ color:plan.color, fontWeight:700 }}>âœ“</span>{f}</div>)}
              </div>
              <button onClick={() => router.push(plan.name==="Free"?"/register":`/dashboard/subscription?plan=${plan.name.toLowerCase()}`)} style={{ width:"100%", background:plan.highlight?plan.color:WHITE, color:plan.highlight?WHITE:plan.color, border:`2px solid ${plan.color}`, borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding:"0 20px 32px" }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:DARK, textAlign:"center", marginBottom:20 }}>Common questions</h2>
        {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
      </div>

      {/* Final CTA */}
      <div style={{ background:`linear-gradient(160deg,${DARK},#2A1200)`, padding:"44px 20px", textAlign:"center" }}>
        <h2 style={{ fontSize:24, fontWeight:900, color:WHITE, marginBottom:10 }}>Ready to start selling?</h2>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginBottom:28 }}>Join South African entrepreneurs selling on Maizu.</p>
       <button onClick={() => router.push(isLoggedIn ? "/become-vendor" : "/register?next=/become-vendor")} style={{ background:P, color:WHITE, border:"none", borderRadius:28, padding:"15px 36px", fontSize:16, fontWeight:800, cursor:"pointer", boxShadow:`0 8px 24px ${P}55` }}>
          Open Your Free Store
        </button>
      </div>

      <BottomNav />
    </div>
  );
}


