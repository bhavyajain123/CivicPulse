import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, MapPin, Radio, Users, Activity, Clock3, Siren, ClipboardList, CheckCircle2 } from 'lucide-react';

const highlights = [
  { icon: MapPin, title: 'Location-aware reporting', text: 'Capture incidents with clear location details so teams know where to respond.' },
  { icon: Radio, title: 'Live operations', text: 'Keep an eye on active incidents, dispatch activity and response progress.' },
  { icon: Users, title: 'Coordinated response teams', text: 'Bring departments and field teams into one connected workflow.' },
];

export default function Home() {
  return <main className="landing">
    <nav className="landing-nav">
      <Link to="/" className="landing-brand"><span className="landing-mark"><Siren size={23}/></span><span><b>CivicConnect</b><small>EMERGENCY OPERATIONS</small></span></Link>
      <div className="landing-nav-links"><a href="#platform">Platform</a><a href="#workflow">How it works</a><Link to="/login" className="btn btn-primary">
  Open command center <ArrowRight size={16}/>
</Link></div>
    </nav>
    <section className="landing-hero">
      <div className="landing-copy">
        <span className="landing-eyebrow"><i/> SMART CITY RESPONSE NETWORK</span>
        <h1>One city.<br/><em>One connected</em><br/>response.</h1>
        <p className="landing-lead">A unified emergency operations platform to report incidents, coordinate response teams and keep every department in sync.</p>
        <div className="landing-actions"><Link to="/login" className="btn btn-primary">
  Open command center <ArrowRight size={16}/>
</Link><a href="#platform" className="btn btn-secondary">Discover the platform</a></div>
        <div className="landing-trust"><span><ShieldCheck size={16}/> Structured incident workflow</span><span><Clock3 size={16}/> Faster coordination</span></div>
      </div>
      <div className="landing-visual">
        <div className="landing-grid"/>
        <div className="landing-ring ring-a"/><div className="landing-ring ring-b"/>
        <div className="landing-emblem"><Siren size={62}/><span>CC</span></div>
        <div className="landing-float float-top"><span className="float-icon blue"><Activity size={17}/></span><div><b>Operations online</b><small>Command network active</small></div><i className="pulse"/></div>
        <div className="landing-float float-bottom"><span className="float-icon green"><CheckCircle2 size={17}/></span><div><b>Response coordinated</b><small>Teams connected across units</small></div></div>
        <div className="landing-stat"><b>24/7</b><span>Operational visibility</span></div>
      </div>
    </section>
    <section className="landing-metrics">
      <div><b>01</b><span>Report an incident</span></div><div><b>02</b><span>Verify and prioritize</span></div><div><b>03</b><span>Dispatch the right team</span></div><div><b>04</b><span>Track until resolution</span></div>
    </section>
    <section id="platform" className="landing-features">
      <div className="landing-section-heading"><span className="landing-eyebrow">BUILT FOR CITY OPERATIONS</span><h2>Clarity when every second matters.</h2><p>Give operators a shared picture of what is happening across the city.</p></div>
      <div className="landing-feature-grid">{highlights.map(({icon:Icon,title,text})=><article className="landing-feature" key={title}><span><Icon size={21}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section id="workflow" className="landing-cta"><div><span className="landing-eyebrow">CIVICCONNECT COMMAND</span><h2>Ready to see the city command center?</h2><p>Explore the interactive dashboard, incident register, response teams and operational analytics.</p></div><Link to="/login" className="btn btn-primary">
  Launch dashboard <ArrowRight size={16}/>
</Link></section>
    <footer className="landing-footer"><span>© 2026 CivicConnect · Emergency Operations</span><span>Connected services. Safer communities.</span></footer>
  </main>;
}
