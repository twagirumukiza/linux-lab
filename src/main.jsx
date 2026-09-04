import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Terminal, BookOpen, FlaskConical, Trophy, Home, Network, Shield, Users, Activity, FolderOpen, Menu, X, Sun, Moon, ChevronRight, CheckCircle2, Lock, RotateCcw, Play, Search, Server, FileText, Bug, Cpu, Wifi, Database, Eye, Award, Keyboard, Sparkles} from 'lucide-react';
import './styles.css';

const CHAPTERS = [
 {id:1,title:'Premiers pas',level:'Débutant',icon:Terminal,desc:'Terminal, chemins, identité et commandes de base.',cmds:['pwd','whoami','date','echo','clear']},
 {id:2,title:'Fichiers & dossiers',level:'Débutant',icon:FolderOpen,desc:'Naviguer et manipuler l’arborescence Linux.',cmds:['ls','cd','mkdir','touch','cp','mv','rm','cat']},
 {id:3,title:'Permissions',level:'Débutant',icon:Shield,desc:'Comprendre rwx, chmod, chown et les droits.',cmds:['ls -l','chmod','chown','umask']},
 {id:4,title:'Utilisateurs & groupes',level:'Intermédiaire',icon:Users,desc:'Utilisateurs, groupes, sudo et identité Linux.',cmds:['id','groups','sudo','passwd']},
 {id:5,title:'Processus & services',level:'Intermédiaire',icon:Activity,desc:'Observer les processus et services actifs.',cmds:['ps','top','kill','systemctl']},
 {id:6,title:'Réseau',level:'Intermédiaire',icon:Network,desc:'IP, ports, DNS, routes et connectivité.',cmds:['ip','ping','ss','curl','dig']},
 {id:7,title:'Logs & diagnostic',level:'Avancé',icon:FileText,desc:'Chercher une information dans les journaux.',cmds:['journalctl','grep','tail','less']},
 {id:8,title:'Linux & cybersécurité',level:'Avancé',icon:Bug,desc:'Missions orientées défense et diagnostic.',cmds:['find','grep','ss','chmod','sudo']}
];

const MISSIONS = [
 {id:1,ch:1,title:'Trouver ton dossier',xp:50,goal:'Affiche le répertoire courant.',answer:'pwd',hint:'La commande affiche le chemin du dossier actuel.'},
 {id:2,ch:2,title:'Explorer Documents',xp:75,goal:'Entre dans /home/student/Documents.',answer:'cd /home/student/Documents',hint:'Utilise cd avec un chemin absolu.'},
 {id:3,ch:2,title:'Créer ton espace',xp:75,goal:'Crée le dossier ~/lab.',answer:'mkdir ~/lab',hint:'mkdir signifie make directory.'},
 {id:4,ch:3,title:'Inspecter les droits',xp:100,goal:'Affiche les permissions détaillées.',answer:'ls -l',hint:'Le mode long de ls affiche les permissions.'},
 {id:5,ch:6,title:'Identifier ton IP',xp:125,goal:'Affiche les interfaces et leurs adresses.',answer:'ip addr',hint:'La commande moderne commence par ip.'},
 {id:6,ch:6,title:'Trouver le port SSH',xp:150,goal:'Affiche les sockets en écoute.',answer:'ss -lnt',hint:'ss permet d’inspecter les sockets réseau.'},
 {id:7,ch:7,title:'Chercher une alerte',xp:175,goal:'Recherche le mot "FAILED" dans /var/log/auth.log.',answer:'grep FAILED /var/log/auth.log',hint:'grep recherche un motif dans un fichier.'},
 {id:8,ch:8,title:'Mission défense',xp:250,goal:'Trouve les fichiers world-writable dans /home/student.',answer:'find /home/student -perm -002',hint:'find peut filtrer les permissions avec -perm.'}
];

const initialFs = () => ({
 '/':{type:'dir',mode:'drwxr-xr-x',owner:'root',group:'root'},
 '/home':{type:'dir',mode:'drwxr-xr-x',owner:'root',group:'root'},
 '/home/student':{type:'dir',mode:'drwxr-xr-x',owner:'student',group:'student'},
 '/home/student/Documents':{type:'dir',mode:'drwxr-xr-x',owner:'student',group:'student'},
 '/home/student/Documents/readme.txt':{type:'file',mode:'-rw-r--r--',owner:'student',group:'student',content:'Bienvenue dans Linux Lab V5.\nPratique avant de mémoriser.\n'},
 '/home/student/notes.txt':{type:'file',mode:'-rw-r--r--',owner:'student',group:'student',content:'TODO: apprendre chmod, grep et ss.\n'},
 '/var':{type:'dir',mode:'drwxr-xr-x',owner:'root',group:'root'},
 '/var/log':{type:'dir',mode:'drwxr-xr-x',owner:'root',group:'root'},
 '/var/log/auth.log':{type:'file',mode:'-rw-r-----',owner:'root',group:'adm',content:'Sep 04 08:10 linuxlab sshd[412]: Accepted publickey for student\nSep 04 08:19 linuxlab sshd[512]: FAILED password for admin from 10.10.10.23\nSep 04 08:20 linuxlab sudo[530]: student : TTY=pts/0 ; COMMAND=/usr/bin/id\n'},
 '/etc':{type:'dir',mode:'drwxr-xr-x',owner:'root',group:'root'},
 '/etc/hostname':{type:'file',mode:'-rw-r--r--',owner:'root',group:'root',content:'linuxlab-v5\n'},
});

const BASE_PROCESSES = [
 {pid:1,user:'root',cpu:'0.0',mem:'0.1',cmd:'/sbin/init'},
 {pid:412,user:'root',cpu:'0.2',mem:'1.1',cmd:'/usr/sbin/sshd -D'},
 {pid:621,user:'student',cpu:'0.1',mem:'0.7',cmd:'-bash'},
 {pid:733,user:'root',cpu:'0.4',mem:'2.2',cmd:'/usr/bin/python3 /opt/monitor.py'},
];

function normalizePath(path,cwd='/home/student'){
 let p=path?.startsWith('/')?path:cwd+'/'+(path||'');
 const parts=[]; p.split('/').forEach(x=>{if(!x||x==='.')return; if(x==='..')parts.pop(); else parts.push(x)});
 return '/'+parts.join('/');
}
function children(fs,dir){return Object.keys(fs).filter(p=>p!==dir && p.startsWith(dir==='/'?'/':dir+'/') && !p.slice(dir==='/'?1:dir.length+1).includes('/')).sort();}
function formatLs(fs,cwd,long=false){return children(fs,cwd).map(p=>{const n=p.split('/').pop(); const f=fs[p]; return long?`${f.mode} 1 ${f.owner.padEnd(7)} ${f.group.padEnd(7)}  ${f.content?.length||4096}  ${n}`:n;}).join(long?'\n':'  ')||'(dossier vide)';}

function App(){
 const saved=JSON.parse(localStorage.getItem('linuxLabV5')||'null');
 const [page,setPage]=useState('dashboard'); const [dark,setDark]=useState(saved?.dark??true); const [mobile,setMobile]=useState(false);
 const [xp,setXp]=useState(saved?.xp??425); const [done,setDone]=useState(saved?.done??[1]); const [selected,setSelected]=useState(saved?.selected??1);
 const [cwd,setCwd]=useState(saved?.cwd??'/home/student'); const [fs,setFs]=useState(saved?.fs??initialFs()); const [history,setHistory]=useState(saved?.history??[{t:'sys',x:'Linux Lab V5 — environnement simulé initialisé.'},{t:'sys',x:'Tape "help" pour voir les commandes disponibles.'}]);
 const [input,setInput]=useState(''); const [processes,setProcesses]=useState(BASE_PROCESSES); const [notice,setNotice]=useState('');
 const mission=MISSIONS.find(m=>m.id===selected)||MISSIONS[0];
 const progress=Math.round(done.length/MISSIONS.length*100);
 useEffect(()=>localStorage.setItem('linuxLabV5',JSON.stringify({dark,xp,done,selected,cwd,fs,history})),[dark,xp,done,selected,cwd,fs,history]);
 const complete=(m)=>{if(!done.includes(m.id)){setDone(d=>[...d,m.id]);setXp(x=>x+m.xp);setNotice(`Mission validée : +${m.xp} XP`);setTimeout(()=>setNotice(''),2600)}};
 const run=(raw)=>{
  const v=raw.trim(); if(!v)return; let out=''; let newCwd=cwd; const [base,...args]=v.split(/\s+/); const low=v.toLowerCase();
  if(low==='help') out='Commandes: pwd whoami ls cd mkdir touch cat cp mv rm chmod chown id groups ps top kill systemctl ip ping ss curl dig grep tail find clear echo date history';
  else if(base==='pwd')out=cwd;
  else if(base==='whoami')out='student';
  else if(base==='date')out=new Date().toLocaleString('fr-FR');
  else if(base==='echo')out=v.slice(5);
  else if(base==='ls'){let target=cwd; let long=false; for(const a of args){if(a==='-l')long=true; else if(!a.startsWith('-'))target=normalizePath(a,cwd)} out=fs[target]?.type==='dir'?formatLs(fs,target,long):`ls: impossible d'accéder à '${target}': Aucun fichier ou dossier de ce type`;}
  else if(base==='cd'){const target=normalizePath(args[0]||'/home/student',cwd); if(fs[target]?.type==='dir'){newCwd=target;out=''}else out=`bash: cd: ${args[0]||''}: Aucun fichier ou dossier de ce type`;}
  else if(base==='mkdir'){const target=normalizePath(args[args.length-1],cwd); if(fs[target])out=`mkdir: impossible de créer '${args[args.length-1]}': Le fichier existe`; else {const parent=target.substring(0,target.lastIndexOf('/'))||'/'; if(!fs[parent])out='mkdir: parent absent'; else {setFs(f=>({...f,[target]:{type:'dir',mode:'drwxr-xr-x',owner:'student',group:'student'}}));out=''}}}
  else if(base==='touch'){const target=normalizePath(args[0],cwd); setFs(f=>({...f,[target]:{type:'file',mode:'-rw-r--r--',owner:'student',group:'student',content:''}}));out=''}
  else if(base==='cat'){const target=normalizePath(args[0],cwd);out=fs[target]?.type==='file'?fs[target].content:`cat: ${args[0]}: Aucun fichier ou dossier de ce type`;}
  else if(base==='rm'){const target=normalizePath(args[args.length-1],cwd); if(target==='/home/student'||target==='/')out='rm: opération refusée'; else {setFs(f=>{const n={...f};Object.keys(n).filter(k=>k===target||k.startsWith(target+'/')).forEach(k=>delete n[k]);return n});out=''}}
  else if(base==='chmod'){const target=normalizePath(args[1]||args[0],cwd); const mode=args[0]; if(fs[target]){let symbolic=fs[target].mode; if(/^\d{3,4}$/.test(mode)){const map={0:'---',1:'--x',2:'-w-',3:'-wx',4:'r--',5:'r-x',6:'rw-',7:'rwx'}; const m=mode.slice(-3).split('').map(x=>map[x]).join(''); symbolic=(fs[target].type==='dir'?'d':'-')+m;} setFs(f=>({...f,[target]:{...f[target],mode:symbolic}}));out=''}else out=`chmod: fichier introuvable: ${args[1]||args[0]}`;}
  else if(base==='chown')out='chown: modification simulée (droits root requis en environnement réel)';
  else if(base==='id')out='uid=1000(student) gid=1000(student) groups=1000(student),27(sudo),4(adm)';
  else if(base==='groups')out='student : student sudo adm';
  else if(base==='ps')out='PID USER       %CPU %MEM COMMAND\n'+processes.map(p=>`${String(p.pid).padEnd(3)} ${p.user.padEnd(10)} ${p.cpu.padEnd(4)} ${p.mem.padEnd(4)} ${p.cmd}`).join('\n');
  else if(base==='top')out='top - Linux Lab simulation\nPID  USER      CPU  COMMAND\n'+processes.slice().sort((a,b)=>b.cpu-a.cpu).map(p=>`${p.pid}  ${p.user.padEnd(8)} ${p.cpu}% ${p.cmd}`).join('\n');
  else if(base==='kill'){const pid=Number(args[0]); if(pid===1)out='kill: opération refusée sur PID 1'; else {setProcesses(p=>p.filter(x=>x.pid!==pid));out=processes.some(x=>x.pid===pid)?'Processus terminé.':`kill: (${pid}) - Aucun processus correspondant`;}}
  else if(base==='systemctl')out=args[1]==='sshd'?'● sshd.service - OpenSSH server\n   Active: active (running)':'systemctl: démonstration simulée';
  else if(base==='ip')out='1: lo    inet 127.0.0.1/8\n2: eth0  inet 192.168.1.42/24\n   gateway 192.168.1.1';
  else if(base==='ping')out=`PING ${args[0]||'localhost'} (192.168.1.1): 56 data bytes\n64 bytes: icmp_seq=1 ttl=64 time=0.42 ms\n64 bytes: icmp_seq=2 ttl=64 time=0.39 ms\n--- 100% packet loss: 0%`; 
  else if(base==='ss')out='State   Local Address:Port   Peer Address:Port\nLISTEN  0.0.0.0:22          0.0.0.0:*\nLISTEN  127.0.0.1:631      0.0.0.0:*';
  else if(base==='curl')out='HTTP/1.1 200 OK\nContent-Type: text/html\n\nLinux Lab V5 simulated endpoint';
  else if(base==='dig')out=`;; ANSWER SECTION:\n${args[0]||'linuxlab.local'}.  60  IN  A  192.168.1.42`;
  else if(base==='grep'){const pattern=args[0];const target=normalizePath(args[1],cwd);const content=fs[target]?.content||'';out=content.split('\n').filter(l=>l.toLowerCase().includes((pattern||'').toLowerCase())).join('\n')||'';}
  else if(base==='tail'){const target=normalizePath(args[args.length-1],cwd);out=(fs[target]?.content||'').split('\n').slice(-11).join('\n');}
  else if(base==='find'){out=args.join(' ').includes('-perm -002')?'/home/student/notes.txt':'/home/student\n/home/student/Documents\n/home/student/Documents/readme.txt\n/home/student/notes.txt';}
  else if(base==='history')out=history.filter(h=>h.t==='cmd').map((h,i)=>`${i+1}  ${h.x}`).join('\n');
  else if(base==='clear'){setHistory([]);setInput('');return;}
  else out=`bash: ${base}: commande introuvable`;
  setCwd(newCwd); setHistory(h=>[...h,{t:'cmd',x:v},{t:'out',x:out}]);
  if(v.replace(/\s+/g,' ').toLowerCase()===mission.answer.toLowerCase())complete(mission);
 };
 const nav=p=>{setPage(p);setMobile(false)};
 return <div className={dark?'app dark':'app'}>
  <header className="topbar"><div className="brand"><div className="logo">🐧</div><div><b>LINUX LAB</b><span>V5 · Linux Sandbox Academy</span></div></div><button className="mobile-btn" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><nav className={mobile?'nav open':'nav'}>{[['dashboard','Dashboard',Home],['course','Cours',BookOpen],['lab','Labs',FlaskConical],['system','Sandbox',Server],['progress','Progression',Trophy]].map(([id,label,I])=><button className={page===id?'active':''} onClick={()=>nav(id)} key={id}><I size={17}/>{label}</button>)}<button className="theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button></nav></header>
  {notice&&<div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
  <main>{page==='dashboard'&&<Dashboard progress={progress} xp={xp} done={done} nav={nav} setSelected={setSelected}/>} {page==='course'&&<Course selected={selected} setSelected={setSelected} nav={nav}/>} {page==='lab'&&<Lab mission={mission} done={done} input={input} setInput={setInput} history={history} run={run} setSelected={setSelected} cwd={cwd}/>} {page==='system'&&<Sandbox fs={fs} cwd={cwd} processes={processes} nav={nav}/>} {page==='progress'&&<Progress xp={xp} done={done} progress={progress}/>}</main>
  <footer>Linux Lab V5 <span>Apprendre · Simuler · Diagnostiquer</span></footer>
 </div>
}

function Dashboard({progress,xp,done,nav,setSelected}){return <section className="container"><div className="hero"><div><div className="eyebrow">LINUX SANDBOX ACADEMY · V5</div><h1>Apprends Linux.<br/><em>Manipule un système.</em></h1><p>Un environnement pédagogique qui simule fichiers, permissions, processus, réseau et logs directement dans ton navigateur.</p><button className="primary" onClick={()=>nav('lab')}><Play size={18}/> Lancer une mission</button></div><div className="hero-terminal"><div className="dots">● ● ●</div><div><span className="green">student@linuxlab</span>:<span className="blue">~</span>$ ss -lnt</div><div>LISTEN 0.0.0.0:22&nbsp;&nbsp; SSH</div><div><span className="green">student@linuxlab</span>:<span className="blue">~</span>$ <span className="cursor">▋</span></div></div></div><div className="stats"><Stat label="Progression" value={progress+' %'} sub="des missions"/><Stat label="XP" value={xp.toLocaleString('fr-FR')} sub="points gagnés"/><Stat label="Labs" value={`${done.length}/${MISSIONS.length}`} sub="missions validées"/><Stat label="Niveau" value={xp>=1000?'Linux Defender':xp>=500?'Linux Explorer':'Linux Rookie'} sub="ton rang"/></div><div className="section-head"><div><div className="eyebrow">NOUVEAU DANS V5</div><h2>Un vrai terrain de pratique</h2></div></div><div className="feature-grid"><Feature icon={FolderOpen} title="Système de fichiers" text="Crée, déplace, lis et supprime des fichiers dans un arbre virtuel persistant."/><Feature icon={Shield} title="Permissions" text="Observe les modes rwx et expérimente chmod sans risque pour ta machine."/><Feature icon={Activity} title="Processus" text="Liste et termine des processus simulés pour comprendre ps, top et kill."/><Feature icon={Network} title="Réseau" text="Explore IP, ports, DNS et sockets avec des réponses pédagogiques."/></div><div className="section-head"><div><div className="eyebrow">PARCOURS</div><h2>Les prochains chapitres</h2></div><button className="ghost" onClick={()=>nav('course')}>Voir le parcours <ChevronRight size={16}/></button></div><div className="chapter-grid">{CHAPTERS.slice(0,4).map((c,i)=><ChapterCard key={c.id} c={c} done={done.includes(i+1)} onClick={()=>{setSelected(c.id);nav('course')}}/>)}</div></section>}
function Stat({label,value,sub}){return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function Feature({icon:I,title,text}){return <div className="feature"><div className="icon"><I size={21}/></div><div><h3>{title}</h3><p>{text}</p></div></div>}
function ChapterCard({c,done,onClick}){const I=c.icon;return <button className="chapter-card" onClick={onClick}><div className="card-top"><div className="icon"><I size={20}/></div>{done?<CheckCircle2 className="ok" size={19}/>:<span className="level">{c.level}</span>}</div><h3>{c.id}. {c.title}</h3><p>{c.desc}</p><div className="card-bottom"><span>{c.cmds.length} commandes</span><ChevronRight size={17}/></div></button>}
function Course({selected,setSelected,nav}){const c=CHAPTERS.find(x=>x.id===selected)||CHAPTERS[0];const I=c.icon;return <section className="container course"><div className="eyebrow">COURS · CHAPITRE {c.id}</div><div className="course-title"><div className="big-icon"><I size={30}/></div><div><h1>{c.title}</h1><p>{c.desc}</p></div></div><div className="course-layout"><aside>{CHAPTERS.map(x=><button className={x.id===c.id?'selected':''} key={x.id} onClick={()=>setSelected(x.id)}><span>{String(x.id).padStart(2,'0')}</span>{x.title}{x.id>6&&<Lock size={14}/>}</button>)}</aside><article><div className="lesson"><span className="pill">OBJECTIF</span><h2>Comprendre avant de mémoriser</h2><p>Chaque commande devient une action dans le sandbox. Tu peux ensuite l’utiliser dans une mission et observer le résultat.</p><div className="command-list">{c.cmds.map(x=><div key={x}><Keyboard size={16}/><code>{x}</code><span>À pratiquer</span></div>)}</div><button className="primary" onClick={()=>nav('lab')}>Ouvrir le Lab <Terminal size={17}/></button></div></article></div></section>}
function Lab({mission,done,input,setInput,history,run,setSelected,cwd}){return <section className="container lab-page"><div className="lab-head"><div><div className="eyebrow">LAB INTERACTIF · {cwd}</div><h1>Mission {mission.id} · {mission.title}</h1><p>{mission.goal}</p></div><div className="xp-badge">+{mission.xp} XP</div></div><div className="lab-grid"><div className="terminal"><div className="terminal-head"><span><span className="status-dot"/> Linux Sandbox</span><span>V5</span></div><div className="terminal-body">{history.slice(-80).map((h,i)=><div key={i} className={h.t}>{h.t==='cmd'&&<span className="prompt">student@linuxlab:{cwd==='/home/student'?'~':cwd}$ </span>}{h.x}</div>)}<div className="input-row"><span>student@linuxlab:{cwd==='/home/student'?'~':cwd}$</span><input autoFocus value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run(input)} placeholder="Tape une commande…"/></div></div></div><div className="mission"><span className="pill">MISSION</span><h2>{mission.goal}</h2><div className="tip"><b>💡 Indice</b><p>{mission.hint}</p></div><div className="context-card"><span>Répertoire courant</span><code>{cwd}</code></div><button className="ghost wide" onClick={()=>run('clear')}><RotateCcw size={16}/> Vider le terminal</button><div className={done.includes(mission.id)?'mission-status success':'mission-status'}>{done.includes(mission.id)?<><CheckCircle2 size={18}/> Mission validée</>:<>⌨️ En attente de ta commande</>}</div><div className="mission-switch"><span>Choisir une mission</span><div>{MISSIONS.map(m=><button key={m.id} className={m.id===mission.id?'current':''} onClick={()=>setSelected(m.id)}>{m.id}</button>)}</div></div></div></div></section>}
function Sandbox({fs,cwd,processes,nav}){const [tab,setTab]=useState('files'); const entries=Object.keys(fs).filter(p=>p!==cwd && p.startsWith(cwd==='/'?'/':cwd+'/')&&!p.slice(cwd==='/'?1:cwd.length+1).includes('/'));return <section className="container sandbox"><div className="eyebrow">SANDBOX · ÉTAT DU SYSTÈME</div><h1>Observe ton Linux virtuel</h1><p className="lead">Tout ce que tu modifies dans le Lab est conservé localement dans ton navigateur.</p><div className="tabs">{[['files','Fichiers',FolderOpen],['processes','Processus',Cpu],['network','Réseau',Wifi],['logs','Logs',FileText]].map(([id,label,I])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><I size={16}/>{label}</button>)}</div>{tab==='files'&&<div className="panel"><div className="panel-title"><FolderOpen size={18}/> {cwd}</div>{entries.map(p=><div className="row" key={p}><span>{fs[p].type==='dir'?'📁':'📄'} {p.split('/').pop()}</span><code>{fs[p].mode}</code><span>{fs[p].owner}:{fs[p].group}</span></div>)}</div>}{tab==='processes'&&<div className="panel"><div className="panel-title"><Activity size={18}/> Processus actifs</div>{processes.map(p=><div className="row" key={p.pid}><span><b>{p.pid}</b> {p.cmd}</span><span>{p.user}</span><code>{p.cpu}% CPU</code></div>)}</div>}{tab==='network'&&<div className="panel"><div className="network-cards"><Feature icon={Wifi} title="eth0" text="192.168.1.42/24 · gateway 192.168.1.1"/><Feature icon={Server} title="SSH" text="TCP/22 · écoute sur toutes les interfaces"/><Feature icon={Database} title="DNS" text="linuxlab.local → 192.168.1.42"/></div></div>}{tab==='logs'&&<div className="panel"><div className="panel-title"><Eye size={18}/> /var/log/auth.log</div><pre>{fs['/var/log/auth.log'].content}</pre></div>}<button className="primary" onClick={()=>nav('lab')}>Retourner au terminal <Terminal size={17}/></button></section>}
function Progress({xp,done,progress}){return <section className="container progress-page"><div className="eyebrow">TON PARCOURS</div><h1>Progression & récompenses</h1><div className="progress-hero"><div className="ring"><strong>{progress}%</strong><span>complété</span></div><div><h2>{xp>=1000?'Linux Defender':xp>=500?'Linux Explorer':'Linux Rookie'}</h2><p>{done.length} mission(s) terminée(s). Les missions avancées introduisent le diagnostic réseau et la défense.</p><div className="bar"><i style={{width:progress+'%'}}/></div></div></div><div className="badges"><Badge icon="🐧" title="First Command" done={done.includes(1)}/><Badge icon="📁" title="File Navigator" done={done.length>=3}/><Badge icon="🔐" title="Permission Master" done={done.includes(4)}/><Badge icon="🌐" title="Network Explorer" done={done.includes(5)||done.includes(6)}/><Badge icon="🛡️" title="Linux Defender" done={done.includes(8)}/></div><div className="roadmap"><Award size={20}/><div><b>Objectif V5</b><p>Termine les 8 missions pour maîtriser le parcours fondamental et débloquer le niveau Linux Defender.</p></div></div></section>}
function Badge({icon,title,done}){return <div className={done?'badge earned':'badge'}><div>{done?icon:'🔒'}</div><b>{title}</b><span>{done?'Débloqué':'À débloquer'}</span></div>}

createRoot(document.getElementById('root')).render(<App/>);
