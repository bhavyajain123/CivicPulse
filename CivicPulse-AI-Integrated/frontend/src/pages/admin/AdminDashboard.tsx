import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, Building2, CalendarDays,MessageSquare, ClipboardList,
  Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Command, Download, Filter,
  Flame, Headphones, LayoutDashboard, LifeBuoy, MapPin, Menu, MoreHorizontal, Plus,
  Search, Settings, Shield, Siren, SlidersHorizontal, Users, X, Zap, Radio, Truck,
  FileText, LogOut, Eye, Navigation, CircleDot, CheckCheck, RefreshCw, Send, UserRound,
  BarChart3, LocateFixed, ExternalLink
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import LiveOperationsMap from "../../components/maps/LiveOperationsMap";
import { incidentService, type Incident as BackendIncident } from "../../services/incidentService";
import { socketService } from "../../services/socketService";
import {
  teamService,
  type ResponseTeam
} from "../../services/teamService";

import {
  notificationService,
  type Notification
} from "../../services/notificationService";
import { assignmentService } from "../../services/assignmentService";

import {
  departmentService,
  type Department
} from "../../services/departmentService";
import ManageComplaints from "./ManageComplaints";
import ManageFeedback from "./ManageFeedback";
import ManageSupport from "./ManageSupport";

import ManageUsers from "./ManageUsers";
import {
  analyticsService,
  type DashboardStatistics
} from "../../services/analyticsService";
import {
  supportService,
  type SupportCategory
} from "../../services/supportService";

import {
  userService,
  type CivicUser
} from "../../services/userService";
import SocketConnectionBadge from "../../components/common/SocketConnectionBadge";

type Page =
  | 'Overview'
  | 'Incidents'
  | 'Live Operations'
  | 'Response Teams'
  | 'Departments'
  | 'Complaints'
  | 'Feedback'
  | 'Users'
  | 'Support'
  | 'Analytics'
  | 'Reports'
  | 'Settings';
type Incident = {
  id: string;
  title: string;
  category: string;
  location: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status:
  | 'New'
  | 'Verified'
  | 'Dispatched'
  | 'In Progress'
  | 'Resolved';
  time: string;
  team: string;
  reporter: string;
  latitude?: number;
  longitude?: number;
  description?: string;
};
const INCIDENT_DEPARTMENT_MAP: Record<string, string> = {
  fire: "fire department",
  accident: "traffic management",
  medical: "medical department",
  crime: "security & law enforcement"
};

const getRequiredDepartment = (
  category?: string
): string | undefined => {
  if (!category) return undefined;

  return INCIDENT_DEPARTMENT_MAP[
    category.trim().toLowerCase()
  ];
};

const getTeamDepartment = (team: ResponseTeam): string => {
  const department = team.departmentId;

  if (!department || typeof department === "string") {
    return "";
  }

  return department.name?.trim().toLowerCase() || "";
};

const trend = [
  { day: 'Mon', incidents: 32, resolved: 24 },
  { day: 'Tue', incidents: 45, resolved: 33 },
  { day: 'Wed', incidents: 38, resolved: 29 },
  { day: 'Thu', incidents: 56, resolved: 42 },
  { day: 'Fri', incidents: 48, resolved: 40 },
  { day: 'Sat', incidents: 67, resolved: 51 },
  { day: 'Sun', incidents: 52, resolved: 44 }
];

const distribution = [
  { name: 'Medical', value: 34, color: '#5b8def' },
  { name: 'Fire', value: 24, color: '#f07862' },
  { name: 'Traffic', value: 20, color: '#eab95d' },
  { name: 'Security', value: 13, color: '#a78bfa' },
  { name: 'Other', value: 9, color: '#45b8a2' }
];


const teams=[{name:'Alpha Response',unit:'Rapid response',members:8,status:'On mission',vehicle:'SUV · CP-04-218',color:'blue',progress:72},{name:'Fire Unit 04',unit:'Fire & rescue',members:6,status:'On mission',vehicle:'Fire engine · FR-104',color:'orange',progress:48},{name:'Medical Unit 12',unit:'Emergency medical',members:4,status:'Available',vehicle:'Ambulance · AM-012',color:'green',progress:0},{name:'Patrol Team 2',unit:'Public safety',members:5,status:'On mission',vehicle:'Patrol · PT-022',color:'purple',progress:86}];
const nav: {group:string;items:{name:Page;icon:any;count?:string}[]}[]=[
{group:'WORKSPACE',items:[{name:'Overview',icon:LayoutDashboard},{name:'Incidents',icon:AlertTriangle,count:'12'},{name:'Live Operations',icon:Radio}]},
{group:'MANAGEMENT',items:[
  {name:'Response Teams',icon:Users},
  {name:'Departments',icon:Building2},
  {name:'Complaints',icon:ClipboardList},
  {name:'Feedback',icon:MessageSquare},
  {name:'Users',icon:UserRound},
  {name:'Support',icon:Headphones},
  {name:'Analytics',icon:BarChart3},
  {name:'Reports',icon:FileText},
]},
{group:'SYSTEM',items:[{name:'Settings',icon:Settings}]}
];
function Badge({children,tone='slate'}:{children:any;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><div><div className="eyebrow">CIVICCONNECT WORKSPACE</div><h2>{title}</h2></div><button className="icon-btn" onClick={close}><X size={18}/></button></div>{children}</div></div>}


function toDashboardIncident(item: BackendIncident): Incident {
const statusMap: Record<
  BackendIncident["status"],
  Incident["status"]
> = {
  pending: "New",
  verified: "Verified",
  assigned: "Dispatched",
  in_progress: "In Progress",
  resolved: "Resolved"
};

  return {
    id: item._id,
    title: item.title,
    category: item.category,
    location:
      item.location.address ||
      `${item.location.latitude}, ${item.location.longitude}`,
    priority: (
      item.priority.charAt(0).toUpperCase() +
      item.priority.slice(1)
    ) as Incident["priority"],
    status: statusMap[item.status],
    time: new Date(item.createdAt).toLocaleString(),
    team: item.assignedTeam?.name || "Unassigned",
    reporter: item.reportedBy?.name || "Unknown",
description: item.description,
    latitude: item.location.latitude,
longitude: item.location.longitude
  };
}

function App(){
 const [page,setPage]=useState<Page>('Overview');const [incidents, setIncidents] = useState<Incident[]>([]);const [query,setQuery]=useState('');const [filter,setFilter]=useState('All');const [modal,setModal]=useState<'incident'|'dispatch'|'notifications'|'profile'|'support'|null>(null);const [selected,setSelected]=useState<Incident|null>(null);const [toast,setToast]=useState('');const [sidebar,setSidebar]=useState(false);const [sidebarCollapsed,setSidebarCollapsed]=useState(false);const [notifications, setNotifications] = useState<Notification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [notificationsLoading, setNotificationsLoading] = useState(false);
const [notifRead, setNotifRead] = useState(false);
const [form,setForm]=useState({title:'',category:'Medical',location:'',priority:'High',description:''});
 const [dispatchIncidents, setDispatchIncidents] =
  useState<BackendIncident[]>([]);

const [dispatchTeams, setDispatchTeams] =
  useState<ResponseTeam[]>([]);

const [selectedDispatchIncidentId, setSelectedDispatchIncidentId] =
  useState("");

const [selectedDispatchTeamId, setSelectedDispatchTeamId] =
  useState("");
  

const [dispatchLoading, setDispatchLoading] = useState(false);
const selectedDispatchIncident = dispatchIncidents.find(
  incident => incident._id === selectedDispatchIncidentId
);

const requiredDispatchDepartment = getRequiredDepartment(
  selectedDispatchIncident?.category
);

const matchingDispatchTeams = dispatchTeams.filter(
  team =>
    !requiredDispatchDepartment ||
    getTeamDepartment(team) === requiredDispatchDepartment
);

const [detailTeams, setDetailTeams] = useState<ResponseTeam[]>([]);
const [detailTeamId, setDetailTeamId] = useState("");

const [detailPriority, setDetailPriority] =
  useState<BackendIncident["priority"]>("medium");

const [detailActionLoading, setDetailActionLoading] = useState(false);
const [detailTeamsLoading, setDetailTeamsLoading] = useState(false);

 const notify=(msg:string)=>{setToast(msg);window.setTimeout(()=>setToast(''),2800)};

 useEffect(() => {
  if (!selected) {
    setDetailTeams([]);
    setDetailTeamId("");
    return;
  }

  let cancelled = false;

  setDetailPriority(
    selected.priority.toLowerCase() as BackendIncident["priority"]
  );

  setDetailTeamsLoading(true);

  teamService.getAll()
    .then(teams => {
      if (cancelled) return;

   const requiredDepartment = getRequiredDepartment(
  selected.category
);

const availableTeams = teams.filter(team => {
  if (!team.isAvailable) return false;

  if (!requiredDepartment) return true;

  return getTeamDepartment(team) === requiredDepartment;
});

setDetailTeams(availableTeams);
setDetailTeamId(availableTeams[0]?._id || "");
    })
    .catch(error => {
      if (cancelled) return;

      console.error("Unable to load available teams:", error);
      setDetailTeams([]);
    })
    .finally(() => {
      if (!cancelled) {
        setDetailTeamsLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [selected?.id, selected?.category]);

 const loadNotifications = async () => {
  setNotificationsLoading(true);

  try {
    const data = await notificationService.getAll();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to load notifications"
    );
  } finally {
    setNotificationsLoading(false);
  }
};

const handleMarkNotificationRead = async (id: string) => {
  try {
    await notificationService.markRead(id);
    await loadNotifications();
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to mark notification as read"
    );
  }
};

const handleMarkAllNotificationsRead = async () => {
  try {
    await notificationService.markAllRead();

    setNotifications(current =>
      current.map(item => ({ ...item, isRead: true }))
    );

    setUnreadCount(0);
    notify("All notifications marked as read");
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to mark notifications as read"
    );
  }
};

const openDispatch = async () => {
  setDispatchLoading(true);

  try {
    const [allIncidents, allTeams] = await Promise.all([
      incidentService.getAll(),
      teamService.getAll()
    ]);

const unassigned = allIncidents.filter(
  incident =>
    incident.status === "verified" &&
    !incident.assignedTeam
);

    const available = allTeams.filter(
      team => team.isAvailable
    );
const firstIncident = unassigned[0];

const firstDepartment = getRequiredDepartment(
  firstIncident?.category
);

const firstMatchingTeams = available.filter(
  team =>
    !firstDepartment ||
    getTeamDepartment(team) === firstDepartment
);

setDispatchIncidents(unassigned);
setDispatchTeams(available);

setSelectedDispatchIncidentId(firstIncident?._id || "");
setSelectedDispatchTeamId(firstMatchingTeams[0]?._id || "");

    setModal("dispatch");

    if (unassigned.length === 0) {
      notify("No unassigned incidents are available.");
    }

    if (available.length === 0) {
      notify("No response teams are currently available.");
    }
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to load dispatch data."
    );
  } finally {
    setDispatchLoading(false);
  }
};


const submitDispatch = async () => {
  if (!selectedDispatchIncidentId || !selectedDispatchTeamId) {
    notify("Please select an incident and a response team.");
    return;
  }

  setDispatchLoading(true);

  try {
    const result = await assignmentService.create({
      incidentId: selectedDispatchIncidentId,
      teamId: selectedDispatchTeamId,
      notes: "Assigned from CivicPulse command center"
    });

    setModal(null);
    setSelectedDispatchIncidentId("");
    setSelectedDispatchTeamId("");

    notify(result.message || "Assignment created successfully.");
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to create assignment."
    );
  } finally {
    setDispatchLoading(false);
  }
};


 const filtered=useMemo(()=>incidents.filter(i=>(filter==='All'||i.status===filter||i.priority===filter)&&`${i.id} ${i.title} ${i.location} ${i.category}`.toLowerCase().includes(query.toLowerCase())),[incidents,filter,query]);
 
const addIncident = async () => {
  if (!form.title.trim() || !form.location.trim()) {
    notify("Please enter an incident title and location.");
    return;
  }

  setDispatchLoading(true);

  try {
   
    const categoryMap: Record<
      string,
      "fire" | "accident" | "medical" | "crime" | "other"
    > = {
      Medical: "medical",
      Fire: "fire",
      Traffic: "accident",
      Security: "crime",
      Infrastructure: "other",
      Utilities: "other"
    };

    const result = await incidentService.create({
      title: form.title.trim(),
      description: form.description.trim()
        ? `${form.description.trim()}\nReported location: ${form.location.trim()}`
        : `Reported location: ${form.location.trim()}. Please verify the location.`,
      category: categoryMap[form.category] || "other",
locationAddress: form.location.trim()
    });

   
    const selectedPriority =
      form.priority.toLowerCase() as BackendIncident["priority"];

    try {
      await incidentService.updateStatus(
        result.incident._id,
        { priority: selectedPriority }
      );
    } catch {
      notify("Incident created, but priority update failed. Default priority is medium.");
    }

const item: Incident = {
  id: result.incident._id,
  title: result.incident.title,
  category: result.incident.category,
  location: result.incident.location.address || form.location,
  priority: form.priority as Incident["priority"],
  status: "New",
  time: "Just now",
  team: "Unassigned",
  reporter: user?.name || "Operations Desk",
  latitude: result.incident.location.latitude,
  longitude: result.incident.location.longitude
};

    setIncidents(prev => [item, ...prev]);

    setForm({
      title: "",
      category: "Medical",
      location: "",
      priority: "High",
      description: ""
    });

    setModal(null);
    setPage("Incidents");

    notify(result.message || "Incident created successfully.");
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to create incident."
    );
  } finally {
    setDispatchLoading(false);
  }
};

 
const updateStatus = async (
  id: string,
  status: Incident["status"]
) => {
const statusMap: Record<
  BackendIncident["status"],
  Incident["status"]
> = {
  pending: "New",
  verified: "Verified",
  assigned: "Dispatched",
  in_progress: "In Progress",
  resolved: "Resolved"
};

  try {
    const result = await incidentService.updateStatus(id, {
      status: statusMap[status]
    });

    setIncidents(previous =>
      previous.map(incident =>
        incident.id === id
          ? { ...incident, status }
          : incident
      )
    );

    notify(result.message || `${id} updated successfully.`);
  } catch (error) {
    notify(
      error instanceof Error
        ? error.message
        : "Unable to update incident status."
    );
  }
};

 const exportCsv=()=>{const rows=[['ID','Title','Category','Location','Priority','Status','Team'],...incidents.map(i=>[i.id,i.title,i.category,i.location,i.priority,i.status,i.team])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='civicpulse-incidents.csv';a.click();URL.revokeObjectURL(a.href);notify('Incident report exported as CSV.');};
 const pageTitle=page==='Live Operations'?'Live Operations':page;
 const navigate = useNavigate();
const { user, setUser } = useAuthContext();
const refreshDashboardIncidents = useCallback(async () => {
  if (!user?.token) return;

  try {
    const data = await incidentService.getAll();

    setIncidents(data.map(toDashboardIncident));
  } catch (error) {
    console.error(
      "Unable to refresh dashboard incidents:",
      error
    );
  }
}, [user?.token]);
const [profileEditing, setProfileEditing] = useState(false);
const [profileName, setProfileName] = useState("");
const [profilePhone, setProfilePhone] = useState("");
const [profileSaving, setProfileSaving] = useState(false);
const [profileError, setProfileError] = useState("");


const openProfileEditor = () => {
  setProfileName(user?.name || "");
  setProfilePhone(user?.phone || "");
  setProfileError("");
  setProfileEditing(true);
};

const handleProfileUpdate = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setProfileError("");

  const name = profileName.trim();
  const phone = profilePhone.trim();

  if (name.length < 2 || name.length > 50) {
    setProfileError("Name must contain 2 to 50 characters.");
    return;
  }

  if (phone.length < 10 || phone.length > 15) {
    setProfileError("Phone must contain 10 to 15 characters.");
    return;
  }

  setProfileSaving(true);

  try {
    const updatedUser = await userService.updateProfile({
      name,
      phone
    });

   
    const updatedAuthUser = {
      ...user,
      ...updatedUser,
      token: user?.token
    };

    
    localStorage.setItem(
      "civicconnect-user",
      JSON.stringify(updatedAuthUser)
    );

    setUser(updatedAuthUser);

    setProfileEditing(false);
    notify("Profile updated successfully.");

  } catch (err) {
    setProfileError(
      err instanceof Error
        ? err.message
        : "Unable to update profile."
    );
  } finally {
    setProfileSaving(false);
  }
};



useEffect(() =>{
  if (!user?.token) return;
  void refreshDashboardIncidents();

  const socket = socketService.connect(user.token);

  void loadNotifications();

  const handleNewNotification = (
    notification?: { type?: string }
  ) => {
    void loadNotifications();

    if (notification?.type === "new_incident") {
      void refreshDashboardIncidents();
    }
  };

  const handleIncidentUpdated = () => {
    void refreshDashboardIncidents();
  };
  const handleSystemPong = (payload: { timestamp: number }) => {
  console.log("[SOCKET TEST] system:pong received:", payload);
};
socket.on("system:pong", handleSystemPong);

socket.emit("system:ping", (ack) => {
  console.log("[SOCKET TEST] system:ping ack:", ack);
});
const adminUserId = "6af60eb6c664908fcd4191ac";

socket.emit(
  "presence:get",
  { userIds: [adminUserId] },
  (result) => {
    console.log("[SOCKET TEST] presence:get ack:", result);
  }
);

const testComplaintId = "6afc4b7f4d92ce6ff10980d4";

socket.emit(
  "complaint:join",
  { complaintId: testComplaintId },
  (joinAck) => {
    console.log(
      "[SOCKET TEST] complaint:join ack:",
      joinAck
    );

    if (joinAck?.ok) {
      socket.emit(
        "complaint:leave",
        { complaintId: testComplaintId },
        (leaveAck) => {
          console.log(
            "[SOCKET TEST] complaint:leave ack:",
            leaveAck
          );
        }
      );
    }
  }
);

  socket.on("new-notification", handleNewNotification);
  socket.on("incident-updated", handleIncidentUpdated);

  return () => {
    socket.off("new-notification", handleNewNotification);
    socket.off("incident-updated", handleIncidentUpdated);

  };
}, [user?.token, refreshDashboardIncidents]);


 const renderContent=()=>{
 if(page==='Overview')return <Overview incidents={incidents} setPage={setPage} setModal={setModal} setSelected={setSelected}/>;
 if(page==='Incidents')return <IncidentsPage incidents={filtered} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} setModal={setModal} setSelected={setSelected} updateStatus={updateStatus} exportCsv={exportCsv}/>;
 if (page === "Live Operations") {
  return (
    <LivePage
      incidents={incidents}
      notify={notify}
      onViewIncident={(incident: BackendIncident) => {
        setSelected(toDashboardIncident(incident));
      }}
    />
  );
}
 if (page === "Response Teams") {
  return (
    <TeamsPage
      notify={notify}
      setPage={setPage}
    />
  );
}
 if(page==='Departments')return <DepartmentsPage notify={notify}/>;
 if(page==='Complaints')return <ManageComplaints notify={notify}/>;
 if(page==='Users') return <ManageUsers />;
 if(page==='Support') return <ManageSupport />;
 if(page==='Analytics') return <AnalyticsPage />;
 if(page==='Reports')return <ReportsPage exportCsv={exportCsv} notify={notify}/>;
 if(page==='Feedback')return <ManageFeedback notify={notify}/>;
 return <SettingsPage notify={notify}/>;
 };
 return <div className="app-shell">
  <aside className={`sidebar ${sidebar?'show':''} ${sidebarCollapsed?'collapsed':''}`}><div className="brand"><div className="brand-mark"><Siren size={22}/></div><div><b>CivicConnect</b><span>EMERGENCY OPERATIONS</span></div><button className="mobile-close icon-btn" aria-label="Hide sidebar" title="Hide sidebar" onClick={()=>{setSidebar(false);setSidebarCollapsed(true);}}><X size={18}/></button></div>
   <div className="workspace-switch"><div className="city-avatar">NC</div><div><b>New Carthage</b><span>Municipal Command</span></div><ChevronDown size={15}/></div>
   {nav.map(group=><div className="nav-group" key={group.group}><div className="nav-label">{group.group}</div>{group.items.map(item=><button key={item.name} className={`nav-item ${page===item.name?'active':''}`} onClick={()=>{setPage(item.name);setSidebar(false);}}><item.icon size={17}/><span>{item.name}</span>{item.count&&<small>{incidents.filter(i=>i.status!=='Resolved').length}</small>}</button>)}</div>)}
   <div className="sidebar-bottom"><div className="support-card"><div className="support-icon"><Headphones size={17}/></div><b>Need assistance?</b><p>Our operations support is available 24/7.</p><button onClick={()=>setModal('support')}>Contact support <ChevronRight size={14}/></button></div>
<div className="user-mini" onClick={() => setModal("profile")}>
  <div className="user-avatar">
    {user?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()}
  </div>
  <div>
    <b>{user?.name || "User"}</b>
    <span>{user?.role || "Unknown role"}</span>
  </div>
  <MoreHorizontal size={18} />
</div>
</div>
  </aside>
  {sidebar&&<div className="mobile-scrim" onClick={()=>setSidebar(false)}/>}
  <main className="main-area"><header className="topbar"><div className="top-left"><button className={`mobile-menu icon-btn ${sidebarCollapsed?'show-toggle':''}`} aria-label="Show sidebar" title="Show sidebar" onClick={()=>{setSidebar(true);setSidebarCollapsed(false);}}><Menu size={19}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{pageTitle}</b></div></div><div className="top-actions"><SocketConnectionBadge /><button className="icon-btn top-search" onClick={()=>{setPage('Incidents');document.getElementById('incident-search')?.focus();}}><Search size={18}/></button><button
  className="icon-btn notification-button"
  onClick={() => {
    setModal("notifications");
    void loadNotifications();
  }}
>
  <Bell size={18} />
  {unreadCount > 0 && <i />}
</button><div className="top-divider"/>
<button
  className="profile-button"
  onClick={() => setModal("profile")}
>
  <div className="user-avatar">
    {user?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()}
  </div>
  <span>
    <b>{user?.name || "User"}</b>
    <small>{user?.role || "Unknown role"}</small>
  </span>
  <ChevronDown size={14} />
</button>
</div></header>
   <div className="content-wrap"><div className="page-heading"><div><div className="eyebrow">{new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric"
}).toUpperCase()} <span className="dot-sep"/> COMMAND CENTER</div><h1>{pageTitle}</h1><p>{page==='Overview'?'A real-time overview of incidents, teams, and city-wide response activity.':page==='Incidents'?'Review, prioritize, and coordinate incoming city incidents.':page==='Live Operations'?'Monitor active incidents and response activity across the city.':`Manage and monitor ${page.toLowerCase()} across your municipal response network.`}</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><Download size={16}/> Export</button><button className="btn btn-primary" onClick={()=>setModal('incident')}><Plus size={17}/> New incident</button></div></div>{renderContent()}</div>
  
  </main>
  {modal==='incident'&&<Modal title="Create new incident" close={()=>setModal(null)}><div className="form-grid"><label className="full">Incident title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Traffic collision on Main Street"/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Medical</option><option>Fire</option><option>Traffic</option><option>Security</option><option>Infrastructure</option><option>Utilities</option></select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label><label className="full">Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Street, sector or landmark"/></label><label className="full">Description<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Add relevant details for the response team..."/></label></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={addIncident}><Plus size={16}/> Create incident</button></div></Modal>}
  {modal === "support" && (
  <Modal
    title="Contact operations support"
    close={() => setModal(null)}
  >
    <div className="support-modal-intro">
      <div className="support-icon large">
        <Headphones size={22} />
      </div>

      <div>
        <b>We're here to help, 24/7</b>
        <p>
          Send a message to the CivicConnect operations
          support desk. Your request will be submitted
          to the support system.
        </p>
      </div>
    </div>

    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const email = String(formData.get("email") || "");
        const category = String(formData.get("category") || "");
        const message = String(formData.get("message") || "");

        try {
          await supportService.create({
            email,
            category: category as SupportCategory,
            message
          });

          setModal(null);
          notify("Support request submitted successfully.");
        } catch (err) {
          notify(
            err instanceof Error
              ? err.message
              : "Unable to submit support request."
          );
        }
      }}
    >
      <label className="full">
        Your email
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
      </label>

      <label className="full">
        What do you need help with?

        <select name="category" defaultValue="Technical issue">
          <option>Technical issue</option>
          <option>Incident workflow</option>
          <option>Account access</option>
          <option>Other request</option>
        </select>
      </label>

      <label className="full">
        Message

        <textarea
          name="message"
          rows={4}
          required
          minLength={8}
          maxLength={3000}
          placeholder="Describe how our operations team can help..."
        />
      </label>

      <div className="full support-contact-line">
        <span>
          <b>Emergency desk</b> · Use your local emergency
          number for immediate danger.
        </span>
      </div>

      <div className="modal-actions full">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setModal(null)}
        >
          Cancel
        </button>

        <button type="submit" className="btn btn-primary">
          <Send size={15} />
          Send support request
        </button>
      </div>
    </form>
  </Modal>
)}
  {modal === "notifications" && (
  <Modal title="Notifications" close={() => setModal(null)}>
    <div className="notification-list">
      {notificationsLoading ? (
        <div className="empty-state">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={24} />
          <b>No notifications yet</b>
          <span>New incident updates will appear here.</span>
        </div>
      ) : (
        notifications.map((item) => (
          <div className="notice-item" key={item._id}>
            <span
              className={`notice-icon ${
                item.type === "new_incident"
                  ? "red"
                  : item.type === "incident_assigned"
                  ? "blue"
                  : "green"
              }`}
            >
              {item.type === "new_incident" ? (
                <AlertTriangle size={17} />
              ) : item.type === "incident_assigned" ? (
                <Users size={17} />
              ) : (
                <CheckCircle2 size={17} />
              )}
            </span>

            <div>
              <b>{item.title}</b>
              <p>{item.message}</p>
              <small>
                {new Date(item.createdAt).toLocaleString()}
              </small>
              {!item.isRead && (
                <small style={{ color: "#5b9cff" }}>Unread</small>
              )}
            </div>

            {!item.isRead && (
              <button
                className="btn btn-secondary"
                onClick={() => void handleMarkNotificationRead(item._id)}
              >
                Mark read
              </button>
            )}
          </div>
        ))
      )}
    </div>

    <div className="modal-actions">
      <button
        className="btn btn-secondary"
        disabled={unreadCount === 0}
        onClick={() => void handleMarkAllNotificationsRead()}
      >
        Mark all as read <CheckCheck size={15} />
      </button>

      <button
        className="btn btn-primary"
        onClick={() => setModal(null)}
      >
        Done
      </button>
    </div>
  </Modal>
)}
 {modal === "profile" && (
  <Modal
    title="Account Profile"
    close={() => {
      setModal(null);
      setProfileEditing(false);
    }}
  >

    {profileEditing ? (

     

      <form
        className="form-grid"
        onSubmit={handleProfileUpdate}
      >

        <label className="full">
          Full Name

          <input
            type="text"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
        </label>

        <label className="full">
          Phone Number

          <input
            type="tel"
            value={profilePhone}
            onChange={e => setProfilePhone(e.target.value)}
            minLength={10}
            maxLength={15}
            required
          />
        </label>

        {profileError && (
          <p
            className="full"
            role="alert"
            style={{ color: "#f28c8c", fontSize: "12px" }}
          >
            {profileError}
          </p>
        )}

        <div className="modal-actions full">

          <button
            type="button"
            className="btn btn-secondary"
            disabled={profileSaving}
            onClick={() => setProfileEditing(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileSaving}
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>

        </div>

      </form>

    ) : (

      /* PROFILE VIEW */

      <>
        <div className="profile-panel">

          <div className="profile-large">
            {user?.name
              ?.split(" ")
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <h3>{user?.name || "User"}</h3>
            <p>{user?.role || "Unknown role"}</p>
            <Badge tone="green">
              Authenticated account
            </Badge>
          </div>

        </div>

        <div className="profile-details">

          <div>
            <span>Email</span>
            <b>{user?.email || "Not available"}</b>
          </div>

          <div>
            <span>Phone</span>
            <b>{user?.phone || "Not provided"}</b>
          </div>

          <div>
            <span>Workspace</span>
            <b>New Carthage Municipal Command</b>
          </div>

          <div>
            <span>Access level</span>
            <b>{user?.role || "Unknown"}</b>
          </div>

        </div>

        <div className="modal-actions">

          <button
            className="btn btn-secondary"
            onClick={openProfileEditor}
          >
            <Settings size={15} />
            Edit Profile
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              authService.clear();
              setUser(null);
              socketService.disconnect();
              setModal(null);
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>

        </div>
      </>

    )}

  </Modal>
)}
<div className="profile-panel">
  <div className="profile-large">
    {user?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()}
  </div>

  <div>
    <h3>{user?.name || "User"}</h3>
    <p>{user?.role || "Unknown role"}</p>
    <Badge tone="green">Authenticated account</Badge>
  </div>
</div>

<div className="profile-details">
  <div>
    <span>Email</span>
    <b>{user?.email || "Not available"}</b>
  </div>
  <div>
    <span>Workspace</span>
    <b>New Carthage Municipal Command</b>
  </div>
  <div>
    <span>Access level</span>
    <b>{user?.role || "Unknown"}</b>
  </div>
</div>
<div className="modal-actions"><button className="btn btn-secondary" onClick={()=>notify('Profile settings are ready for backend integration.')}><Settings size={15}/> Edit profile</button><button
  className="btn btn-primary"
  onClick={() => {
    authService.clear();
    setUser(null);
    socketService.disconnect();
    setModal(null);
    navigate("/login", { replace: true });
  }}
>
  <LogOut size={15} />
  Sign out
</button></div>
  
{modal === "dispatch" && (
  <Modal
    title="Dispatch response team"
    close={() => setModal(null)}
  >
    <p className="modal-copy">
      Select an unassigned incident and an available response team.
    </p>

    <div className="form-grid" style={{ marginTop: "16px" }}>
      <label className="full">
        Select incident
        <select
          value={selectedDispatchIncidentId}
          onChange={e => {
  const incidentId = e.target.value;

  setSelectedDispatchIncidentId(incidentId);

  const incident = dispatchIncidents.find(
    item => item._id === incidentId
  );

  const department = getRequiredDepartment(
    incident?.category
  );

  const matchingTeams = dispatchTeams.filter(
    team =>
      !department ||
      getTeamDepartment(team) === department
  );

  setSelectedDispatchTeamId(
    matchingTeams[0]?._id || ""
  );
}}
        >
          <option value="">Choose incident</option>

          {dispatchIncidents.map(incident => (
            <option key={incident._id} value={incident._id}>
              {incident.title} · {incident.priority.toUpperCase()}
            </option>
          ))}
        </select>
      </label>

      <label className="full">
        Select response team
        <select
          value={selectedDispatchTeamId}
          onChange={e => setSelectedDispatchTeamId(e.target.value)}
        >
          <option value="">Choose response team</option>

{matchingDispatchTeams.map(team => (
  <option key={team._id} value={team._id}>
    {team.name}
  </option>
))}
{matchingDispatchTeams.length === 0 && (
  <p style={{ fontSize: "12px", color: "#f0b45c" }}>
    No available team found for this incident department.
  </p>
)}
        </select>
      </label>
    </div>

    {dispatchIncidents.length === 0 && (
      <p className="modal-copy">
        No unassigned incidents available.
      </p>
    )}

    {dispatchTeams.length === 0 && (
      <p className="modal-copy">
        No available response teams.
      </p>
    )}

    <div className="modal-actions">
      <button
        className="btn btn-secondary"
        onClick={() => setModal(null)}
      >
        Cancel
      </button>

      <button
        className="btn btn-primary"
        disabled={
          dispatchLoading ||
          !selectedDispatchIncidentId ||
          !selectedDispatchTeamId
        }
        onClick={() => void submitDispatch()}
      >
        {dispatchLoading ? "Assigning..." : "Assign team"}
      </button>
    </div>
  </Modal>
)}

{selected && (
  <Modal
    title="Incident details"
    close={() => setSelected(null)}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "16px",
        marginTop: "18px"
      }}
    >
      <div>
        <small>Incident title</small>
        <p><b>{selected.title}</b></p>
      </div>

      <div>
        <small>Incident ID</small>
        <p style={{ overflowWrap: "anywhere" }}>
          {selected.id}
        </p>
      </div>

      <div>
        <small>Category</small>
        <p>{selected.category}</p>
      </div>

      <div>
        <small>Priority</small>
        <Badge
          tone={
            selected.priority === "Critical"
              ? "red"
              : selected.priority === "High"
              ? "orange"
              : "blue"
          }
        >
          {selected.priority}
        </Badge>
      </div>

      <div>
        <small>Status</small>
        <p>{selected.status}</p>
      </div>

      <div>
        <small>Assigned team</small>
        <p>{selected.team}</p>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <small>Location</small>
        <p>{selected.location}</p>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <small>Description</small>
        <p>
          {selected.description || "No description provided."}
        </p>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <small>Reported by</small>
        <p>{selected.reporter}</p>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <small>Reported at</small>
        <p>{selected.time}</p>
      </div>
    </div>


{/* Incident management actions */}
{selected.status !== "Resolved" && (
  <div
    style={{
      marginTop: "22px",
      padding: "16px",
      borderRadius: "10px",
      background: "rgba(91, 141, 239, 0.07)",
      border: "1px solid #2b3b54"
    }}
  >
    <h3 style={{ margin: "0 0 14px", fontSize: "14px" }}>
      Incident management
    </h3>

    {/* Update priority */}
    <label className="full">
      Update priority

      <select
        value={detailPriority}
        disabled={detailActionLoading}
        onChange={e =>
          setDetailPriority(
            e.target.value as BackendIncident["priority"]
          )
        }
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
    </label>

    <button
      type="button"
      className="btn btn-secondary"
      disabled={
        detailActionLoading ||
        detailPriority === selected.priority.toLowerCase()
      }
      style={{ marginTop: "10px" }}
      onClick={async () => {
        setDetailActionLoading(true);

        try {
          const result = await incidentService.updateStatus(
            selected.id,
            { priority: detailPriority }
          );

          const updatedPriority =
            (detailPriority.charAt(0).toUpperCase() +
              detailPriority.slice(1)) as Incident["priority"];

          setSelected(current =>
            current
              ? { ...current, priority: updatedPriority }
              : current
          );

          setIncidents(current =>
            current.map(item =>
              item.id === selected.id
                ? { ...item, priority: updatedPriority }
                : item
            )
          );

          notify(result.message || "Priority updated successfully.");
        } catch (error) {
          notify(
            error instanceof Error
              ? error.message
              : "Unable to update incident priority."
          );
        } finally {
          setDetailActionLoading(false);
        }
      }}
    >
      {detailActionLoading ? "Updating..." : "Update priority"}
    </button>

    {selected.status === "New" && (
  <button
    type="button"
    className="btn btn-primary"
    style={{ marginTop: "14px" }}
    disabled={detailActionLoading}
    onClick={async () => {
      setDetailActionLoading(true);

      try {
        const result = await incidentService.updateStatus(
          selected.id,
          { status: "verified" }
        );

        setSelected(current =>
          current
            ? {
                ...current,
                status: "Verified"
              }
            : current
        );

        setIncidents(current =>
          current.map(item =>
            item.id === selected.id
              ? {
                  ...item,
                  status: "Verified"
                }
              : item
          )
        );

        notify(
          result.message || "Incident verified successfully."
        );

      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : "Unable to verify incident."
        );
      } finally {
        setDetailActionLoading(false);
      }
    }}
  >
    <CheckCircle2 size={15} />
    {detailActionLoading ? "Verifying..." : "Verify Incident"}
  </button>
)}
{selected.status === "Verified" &&
  selected.team === "Unassigned" && (
        <div style={{ marginTop: "20px" }}>
          <label className="full">
            Assign response team

            <select
              value={detailTeamId}
              disabled={
                detailActionLoading ||
                detailTeamsLoading ||
                detailTeams.length === 0
              }
              onChange={e => setDetailTeamId(e.target.value)}
            >
              <option value="">
                {detailTeamsLoading
                  ? "Loading teams..."
                  : detailTeams.length === 0
                  ? "No available teams"
                  : "Select response team"}
              </option>

              {detailTeams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          {detailTeams.length === 0 && !detailTeamsLoading && (
            <p style={{ fontSize: "12px", color: "#f0b45c" }}>
              No available response teams for this incident department.
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: "10px" }}
            disabled={
              detailActionLoading ||
              detailTeamsLoading ||
              !detailTeamId
            }
            onClick={async () => {
              if (!detailTeamId) return;

              setDetailActionLoading(true);

              try {
                const team = detailTeams.find(
                  item => item._id === detailTeamId
                );

                const result = await assignmentService.create({
                  incidentId: selected.id,
                  teamId: detailTeamId,
                  notes: "Assigned from incident details map"
                });

                const teamName = team?.name || "Assigned";

                setSelected(current =>
                  current
                    ? {
                        ...current,
                        status: "Dispatched",
                        team: teamName
                      }
                    : current
                );

                setIncidents(current =>
                  current.map(item =>
                    item.id === selected.id
                      ? {
                          ...item,
                          status: "Dispatched",
                          team: teamName
                        }
                      : item
                  )
                );

                notify(
                  result.message || "Response team assigned successfully."
                );
              } catch (error) {
                notify(
                  error instanceof Error
                    ? error.message
                    : "Unable to assign response team."
                );
              } finally {
                setDetailActionLoading(false);
              }
            }}
          >
            {detailActionLoading
              ? "Processing..."
              : "Assign Response Team"}
          </button>
        </div>
      )}

    {selected.team !== "Unassigned" && (
      <p style={{ fontSize: "12px", color: "#42c39b" }}>
        Response team: {selected.team}
      </p>
    )}
  </div>
)}


    <div className="modal-actions">
      <button
        className="btn btn-primary"
        onClick={() => setSelected(null)}
      >
        Close
      </button>
    </div>
  </Modal>
)}

  {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
 </div>;
}
function Overview({
  incidents,
  setPage,
  setModal,
  setSelected
}: {
  incidents: Incident[];
  setPage: (p: Page) => void;
  setModal: (m: any) => void;
  setSelected: (i: Incident) => void;
}) {
  
  const [deployedTeamCount, setDeployedTeamCount] =
    useState<number | null>(null);

  const [statistics, setStatistics] =
    useState<DashboardStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuthContext();

  const [mapIncidents, setMapIncidents] =
    useState<BackendIncident[]>([]);

  const [mapTeams, setMapTeams] =
    useState<ResponseTeam[]>([]);

  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await analyticsService.getDashboard();
      setStatistics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  void loadDashboard();
}, [loadDashboard, incidents]);

useEffect(() => {
  let cancelled = false;

  const loadDeployedTeams = async () => {
    try {
      const assignments = await assignmentService.getAll();

      const activeStatuses = new Set([
        "assigned",
        "accepted",
        "in_progress"
      ]);

      const activeTeamIds = new Set(
        assignments
          .filter(assignment =>
            activeStatuses.has(assignment.status)
          )
          .map(assignment =>
            typeof assignment.teamId === "string"
              ? assignment.teamId
              : assignment.teamId?._id
          )
          .filter(
            (teamId): teamId is string => Boolean(teamId)
          )
      );

      if (!cancelled) {
        setDeployedTeamCount(activeTeamIds.size);
      }

    } catch (error) {
      console.error(
        "Unable to load deployed team count:",
        error
      );

      if (!cancelled) {
        setDeployedTeamCount(null);
      }
    }
  };

  void loadDeployedTeams();

  return () => {
    cancelled = true;
  };
}, [incidents]);

const loadMapData = useCallback(async () => {
  if (!user?.token) {
    setMapIncidents([]);
    setMapTeams([]);
    setMapLoading(false);
    return;
  }

  setMapLoading(true);
  setMapError("");

  try {
    const [incidentData, teamData] = await Promise.all([
      incidentService.getAll(),
      teamService.getAll()
    ]);

    setMapIncidents(incidentData);
    setMapTeams(teamData);

  } catch (err) {
    setMapError(
      err instanceof Error
        ? err.message
        : "Unable to load live map data"
    );
  } finally {
    setMapLoading(false);
  }
}, [user?.token]);


useEffect(() => {
  void loadMapData();
}, [loadMapData, incidents]);


  const overview = statistics?.overview;

  const active =
    overview
      ? overview.pendingIncidents +
        overview.verifiedIncidents +
        overview.assignedIncidents
      : incidents.filter(i => i.status !== "Resolved").length;

  const critical = incidents.filter(
    i => i.priority === "Critical" && i.status !== "Resolved"
  ).length;

  const resolved =
    overview?.resolvedIncidents ??
    incidents.filter(i => i.status === "Resolved").length;


  const totalTeams = statistics?.teams.length ?? 0;

  const availableTeams =
    statistics?.teams.filter(team => team.isAvailable).length ?? 0;

  const deployedTeams = totalTeams - availableTeams;


 
const monthlyMap = new Map(
  (statistics?.monthly ?? []).map(item => [
    `${item._id.year}-${item._id.month}`,
    item.count
  ])
);


const currentDate = new Date();

const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() - 11 + index,
    1
  );

  const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

  return {
    month: date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit"
    }),

    incidents: monthlyMap.get(key) ?? 0
  };
});

  const totalIncidents =
    overview?.totalIncidents ?? incidents.length;

  const categoryColors: Record<string, string> = {
    medical: "#5b8def",
    fire: "#f07862",
    accident: "#eab95d",
    crime: "#a78bfa",
    other: "#45b8a2"
  };

  const categoryData = (statistics?.category ?? []).map(item => ({
    name: item._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : "Other",

    value:
      totalIncidents > 0
        ? Number(((item.count / totalIncidents) * 100).toFixed(1))
        : 0,

    color:
      categoryColors[item._id.toLowerCase()] || "#8090a8"
  }));


  const priorityOrder: Record<Incident["priority"], number> = {
    Critical: 0,
    High: 1,
    Medium: 2,
    Low: 3
  };

  const priorityIncidents = incidents
    .filter(i => i.status !== "Resolved")
    .sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    .slice(0, 5);

  const activeCritical = incidents.filter(
    i => i.priority === "Critical" && i.status !== "Resolved"
  ).length;

  return (
    <>
      {}
      <div className="stats-grid">

        <Stat
          icon={AlertTriangle}
          label="Active incidents"
          value={active.toLocaleString()}
          change="Live count"
          tone="orange"
          note="Pending, verified and assigned"
        />

        <Stat
          icon={Siren}
          label="Critical incidents"
          value={critical.toLocaleString()}
          change="Requires attention"
          tone="red"
          note="Unresolved critical incidents"
        />

        <Stat
          icon={Users}
          label="Teams deployed"
          value={deployedTeamCount !== null ? String(deployedTeamCount) : "—"}
          change="Live count"
          tone="blue"
          note={
            statistics
              ? `${availableTeams} available out of ${totalTeams} teams`
              : "Loading team statistics"
          }
        />

        <Stat
          icon={CheckCircle2}
          label="Resolved incidents"
          value={resolved.toLocaleString()}
          change="Database total"
          tone="green"
          note="Total resolved incidents"
        />

      </div>

      {}
      <div className="overview-grid">

        <section className="panel trend-panel">

          <div className="panel-head">
            <div>
              <h3>Monthly incident activity</h3>
              <p>Actual incidents recorded in MongoDB</p>
            </div>

            <button
              className="icon-btn"
              title="Refresh dashboard statistics"
              onClick={() => void loadDashboard()}
              disabled={loading}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {error && (
            <p role="alert" style={{ color: "#f28c8c", fontSize: "12px" }}>
              {error}
            </p>
          )}

          {loading && !statistics ? (
            <div className="empty-state">
              Loading monthly incident data...
            </div>
          ) : monthlyTrend.length > 0 ? (

            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrend}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="incoming"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#5b8def"
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="100%"
                        stopColor="#5b8def"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#25334a"
                    strokeDasharray="3 5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#8090a8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#8090a8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111c2e",
                      border: "1px solid #2b3b54",
                      borderRadius: 10,
                      color: "#e8eef8"
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="incidents"
                    name="Incidents"
                    stroke="#6b9af2"
                    strokeWidth={2.5}
                    fill="url(#incoming)"
                    dot={{ r: 3, fill: "#6b9af2" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />

                </AreaChart>
              </ResponsiveContainer>
            </div>

          ) : (
            <div className="empty-state">
              No monthly incident records available.
            </div>
          )}

        </section>

        {}

        <section className="panel distribution-panel">

          <div className="panel-head">
            <div>
              <h3>Incident breakdown</h3>
              <p>Distribution by actual incident category</p>
            </div>
          </div>

          {loading && !statistics ? (
            <div className="empty-state">
              Loading categories...
            </div>
          ) : categoryData.length > 0 ? (
            <>
              <div className="donut-wrap">

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={91}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {categoryData.map((item, index) => (
                        <Cell key={index} fill={item.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background: "#111c2e",
                        border: "1px solid #2b3b54",
                        borderRadius: 10,
                        color: "#e8eef8"
                      }}
                      formatter={(value) => [`${value}%`, "Share"]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <b>{totalIncidents.toLocaleString()}</b>
                  <span>Total cases</span>
                </div>

              </div>

              <div className="distribution-legend">
                {categoryData.map(item => (
                  <div key={item.name}>
                    <span>
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <b>{item.value}%</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              No category records available.
            </div>
          )}

        </section>

      </div>

      {}

      <div className="lower-grid">

        <section className="panel incidents-panel">

          <div className="panel-head">
            <div>
              <h3>Priority incidents</h3>
              <p>Highest-priority unresolved incidents</p>
            </div>

            <button
              className="text-link"
              onClick={() => setPage("Incidents")}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          {priorityIncidents.length > 0 ? (
            <IncidentTable
              incidents={priorityIncidents}
              setSelected={setSelected}
            />
          ) : (
            <div className="empty-state">
              <CheckCircle2 size={24} />
              <b>No active incidents</b>
              <span>There are no unresolved incidents requiring coordination.</span>
            </div>
          )}

        </section>

        <section className="panel map-panel">

          <div className="panel-head">
            <div>
              <h3>City response map</h3>
              <p>Incident coordinates from backend records</p>
            </div>

            <Badge tone="green">
              <span className="live-dot" /> DATABASE
            </Badge>
          </div>

          <div
  className="big-map"
  style={{
    height: "320px",
    minHeight: "320px",
    position: "relative"
  }}
>
  {mapLoading ? (
    <div className="empty-state">
      Loading live operations map...
    </div>
  ) : mapError ? (
    <div className="empty-state">
      <b>Map data unavailable</b>
      <span>{mapError}</span>

      <button
        className="btn btn-secondary"
        onClick={() => void loadMapData()}
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  ) : (
    <>
<LiveOperationsMap
  incidents={mapIncidents}
  teams={mapTeams}
  onViewIncident={(incident) => {
    setSelected(toDashboardIncident(incident));
  }}
/>

      <div className="map-live-tag">
        <span className="live-dot" />
        LIVE OPERATIONS
      </div>
    </>
  )}
</div>

       <div className="map-foot">
  <span>
    <i className="map-key red-key" />
    Critical{" "}
    <b>
      {
        mapIncidents.filter(
          incident =>
            incident.priority === "critical" &&
            incident.status !== "resolved"
        ).length
      }
    </b>
  </span>

  <span>
    <i className="map-key blue-key" />
    Active{" "}
    <b>
      {
        mapIncidents.filter(
          incident => incident.status !== "resolved"
        ).length
      }
    </b>
  </span>

  <button
    className="text-link"
    onClick={() => setPage("Live Operations")}
  >
    Open live map <ChevronRight size={14} />
  </button>
</div>
        </section>

      </div>

      {}

      <div className="quick-actions">

        <div>
          <b>Quick actions</b>
          <span>Common command center tasks</span>
        </div>

        <button onClick={() => setModal("incident")}>
          <Plus size={17} /> Report incident
        </button>

        <button onClick={() => setPage("Live Operations")}>
          <Radio size={17} /> Open live operations
        </button>

        <button onClick={() => setPage("Response Teams")}>
          <Users size={17} /> Manage teams
        </button>

      </div>
    </>
  );
}
function Stat({icon:Icon,label,value,change,tone,note}:any){return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tone}`}><Icon size={18}/></div></div><div className="stat-value">{value}</div><div className="stat-bottom"><Badge tone={tone==='red'?'red':tone==='orange'?'orange':tone==='green'?'green':'blue'}>{tone==='red'?<AlertTriangle size={11}/>:<ArrowUpRight size={12}/>} {change}</Badge><small>{note}</small></div></div>}
function IncidentTable({incidents,setSelected}:{incidents:Incident[];setSelected:(i:Incident)=>void}){return <div className="table-scroll"><table><thead><tr><th>INCIDENT</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th/></tr></thead><tbody>{incidents.map(i=><tr key={i.id} onClick={()=>setSelected(i)}><td><b>{i.title}</b><small>{i.id} · {i.time}</small></td><td><span className="location-cell"><MapPin size={12}/>{i.location}</span></td><td><Badge tone={i.priority==='Critical'?'red':i.priority==='High'?'orange':i.priority==='Medium'?'blue':'slate'}>{i.priority}</Badge></td><td><Badge tone={i.status==='Resolved'?'green':i.status==='In Progress'?'blue':'orange'}>{i.status}</Badge></td><td><button className="row-more" onClick={e=>{e.stopPropagation();setSelected(i)}}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div>}

function IncidentsPage({incidents,query,setQuery,filter,setFilter,setModal,setSelected,updateStatus,exportCsv}:any){return <section className="panel full-panel"><div className="toolbar"><div className="search-field"><Search size={16}/><input id="incident-search" placeholder="Search incidents, locations, IDs..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></div><div className="toolbar-right"><div className="filter-wrap"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>New</option><option>Dispatched</option><option>In Progress</option><option>Resolved</option><option>Critical</option><option>High</option></select></div><button className="btn btn-secondary" onClick={exportCsv}><Download size={15}/> Export CSV</button><button className="btn btn-primary" onClick={()=>setModal('incident')}><Plus size={16}/> New incident</button></div></div><div className="list-summary"><span>Showing <b>{incidents.length}</b> incidents</span><span><span className="live-dot"/> Updates in real time</span></div><IncidentTable incidents={incidents} setSelected={setSelected}/>{incidents.length===0&&<div className="empty-state"><Search size={25}/><b>No incidents found</b><span>Try changing your search or filter.</span></div>}</section>}

function LivePage({ notify, onViewIncident }: any) {
  const [layer, setLayer] = useState("All incidents");
  const [liveIncidents, setLiveIncidents] = useState<BackendIncident[]>([]);
  const [teams, setTeams] = useState<ResponseTeam[]>([]);
useEffect(() => {
  console.log(
    "[GPS] LivePage teams state changed:",
    teams.map(team => ({
      id: String(team._id),
      name: team.name,
      latitude: team.currentLocation?.latitude,
      longitude: team.currentLocation?.longitude,
      updatedAt: team.currentLocation?.updatedAt
    }))
  );
}, [teams]);

  const [socketConnected, setSocketConnected] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refreshIncidents = useCallback(async () => {
    try {
      const data = await incidentService.getAll();
      setLiveIncidents(data);
      setLoadError("");
      setUpdatedAt(new Date());
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load incidents"
      );
    }
  }, []);
  const refreshTeams = useCallback(async () => {
  try {
    const data = await teamService.getAll();
    setTeams(data);
  } catch (error) {
    console.error("Unable to load response teams:", error);
  }
}, []);

useEffect(() => {
  let savedUser: { token?: string } | null = null;

  try {
    savedUser = JSON.parse(
      localStorage.getItem("civicconnect-user") || "null"
    );
  } catch {
    savedUser = null;
  }

  if (!savedUser?.token) {
    setLoadError(
      "Login with an admin or operator account to view live incidents."
    );
    return;
  }

  void refreshIncidents();
  void refreshTeams();

  const socket = socketService.connect(savedUser.token);

  
  setSocketConnected(socket.connected);

  const handleNewNotification = (
    notification: { type?: string }
  ) => {
    if (notification?.type === "new_incident") {
      void refreshIncidents();
    }
  };

  const handleIncidentUpdated = () => {
    void refreshIncidents();
  };

const handleTeamLocationUpdated = (location: {
  teamId: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}) => {
  console.log("[GPS] Received:", location);

  setTeams(currentTeams => {
    const matched = currentTeams.some(
      team => String(team._id) === String(location.teamId)
    );

    console.log("[GPS] Team matched:", matched);

    if (!matched) {
      console.warn(
        "[GPS] Team not found:",
        location.teamId,
        currentTeams.map(team => ({
          id: team._id,
          name: team.name
        }))
      );

      return currentTeams;
    }

    return currentTeams.map(team =>
      String(team._id) === String(location.teamId)
        ? {
            ...team,
            currentLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              updatedAt: location.updatedAt
            }
          }
        : team
    );
  });
};

const trackingTestIncidentId =
  "6afc9f6dd3700cd8f8c753bb";

const handleAdvancedTrackingUpdate = (payload: {
  teamId: string;
  incidentId: string;
  latitude: number;
  longitude: number;
  userId: string;
  timestamp: string;
}) => {
  console.log(
    "[SOCKET TEST] tracking:updated received:",
    payload
  );
};

const handleTrackingRoomJoined = (data: {
  incidentId: string;
}) => {
  if (data.incidentId === trackingTestIncidentId) {
    console.log(
      "[SOCKET TEST] Admin joined tracking room:",
      data.incidentId
    );
  }
};

const joinTrackingTestRoom = () => {
  socket.emit("join-incident", trackingTestIncidentId);
};

socket.on("tracking:updated", handleAdvancedTrackingUpdate);
socket.on("incident-joined", handleTrackingRoomJoined);
socket.on("connect", joinTrackingTestRoom);

if (socket.connected) {
  joinTrackingTestRoom();
}
  const handleConnect = () => setSocketConnected(true);

  const handleDisconnect = () => setSocketConnected(false);

  const handleConnectError = (error: Error) => {
    setSocketConnected(false);
    setLoadError(`Live connection failed: ${error.message}`);
  };

  socket.on("new-notification", handleNewNotification);
  socket.on("incident-updated", handleIncidentUpdated);
  socket.on("team-location-updated", handleTeamLocationUpdated);


socket.emit("system:ping", (ack) => {
  console.log("[SOCKET TEST] system:ping ack:", ack);
});

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleConnectError);

  return () => {
    socket.off("new-notification", handleNewNotification);
    socket.off("incident-updated", handleIncidentUpdated);
    socket.off("team-location-updated", handleTeamLocationUpdated);
   
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleConnectError);
    socket.off("tracking:updated", handleAdvancedTrackingUpdate);
socket.off("incident-joined", handleTrackingRoomJoined);
socket.off("connect", joinTrackingTestRoom);

socket.emit("leave-incident", trackingTestIncidentId);

  };
}, [refreshIncidents, refreshTeams]);

  const visibleIncidents = liveIncidents.filter(
    incident =>
      layer !== "Critical only" ||
      incident.priority === "critical"
  );

  const activeIncidents = visibleIncidents.filter(
    incident => incident.status !== "resolved"
  );

  return (
    <div className="live-layout">
      <section className="panel live-map-panel">
        <div className="panel-head">
          <div>
            <h3>City operations map</h3>
            <p>
              <span
                className="live-dot"
                style={{
                  background: socketConnected ? "#42c39b" : "#ef4444"
                }}
              />{" "}
              {socketConnected ? "Socket connected" : "Socket disconnected"}
              {" · "}Backend incident data
            </p>
          </div>

          <div className="map-tools">
            <select
              value={layer}
              onChange={e => setLayer(e.target.value)}
            >
              <option>All incidents</option>
              <option>Critical only</option>
            </select>

            <button
              className="icon-btn"
              title="Refresh incidents"
              onClick={() => void refreshIncidents()}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="big-map">
<LiveOperationsMap
  incidents={visibleIncidents}
  teams={teams}
  onViewIncident={onViewIncident}
  showOnlyDeployedTeams
/>
          <div className="map-live-tag">
            <span className="live-dot" />
            {socketConnected ? "LIVE FEED" : "CONNECTION OFFLINE"}
            <small>
              {updatedAt
                ? `Updated ${updatedAt.toLocaleTimeString()}`
                : "Waiting for data"}
            </small>
          </div>
        </div>

        <div className="map-legend">
          <span>
            <i className="map-key red-key" /> Critical
          </span>
          <span>
            <i className="map-key orange-key" /> High
          </span>
          <span>
            <i className="map-key" style={{ background: "#eab308" }} /> Medium
          </span>
          <span>
            <i className="map-key" style={{ background: "#22c55e" }} /> Low
          </span>
        </div>
      </section>

      <section className="panel live-queue">
        <div className="panel-head">
          <div>
            <h3>Live incident feed</h3>
            <p>{activeIncidents.length} active incidents</p>
          </div>
          <Badge tone="green">
            {socketConnected ? "LIVE" : "OFFLINE"}
          </Badge>
        </div>

        {loadError && liveIncidents.length === 0 && (
          <div className="empty-state">
            <b>Incident data unavailable</b>
            <span>{loadError}</span>
            <button
              className="btn btn-secondary"
              onClick={() => void refreshIncidents()}
            >
              Retry
            </button>
          </div>
        )}

        {!loadError && activeIncidents.length === 0 && (
          <div className="empty-state">
            <b>No active incidents</b>
            <span>New backend incidents will appear here.</span>
          </div>
        )}

        <div className="feed-list">
          {activeIncidents.map(incident => (
            <div className="feed-item" key={incident._id}>
              <span
                className={`feed-priority ${incident.priority}`}
              />

              <div>
                <b>{incident.title}</b>
                <span>
                  {incident.location.address || "Location unavailable"}
                </span>
                <small>
                  {incident._id} ·{" "}
                  {new Date(incident.createdAt).toLocaleTimeString()}
                </small>
              </div>

              <Badge
                tone={
                  incident.priority === "critical"
                    ? "red"
                    : incident.priority === "high"
                    ? "orange"
                    : incident.priority === "medium"
                    ? "blue"
                    : "green"
                }
              >
                {incident.priority.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


function TeamsPage({ notify, setPage }: any) {
  const [tab, setTab] = useState("All teams");
  const [realTeams, setRealTeams] = useState<ResponseTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [selectedTeamDetails, setSelectedTeamDetails] =
  useState<ResponseTeam | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
const [detailsError, setDetailsError] = useState("");
const [responseTeamUsers, setResponseTeamUsers] =
  useState<CivicUser[]>([]);

const [selectedMemberId, setSelectedMemberId] =
  useState("");

const [memberSaving, setMemberSaving] = useState(false);
const [departments, setDepartments] = useState<Department[]>([]);
const [departmentsLoading, setDepartmentsLoading] = useState(false);
const [departmentsError, setDepartmentsError] = useState("");

const [formOpen, setFormOpen] = useState(false);
const [newTeamName, setNewTeamName] = useState("");
const [newTeamDepartmentId, setNewTeamDepartmentId] = useState("");
const [saving, setSaving] = useState(false);
  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await teamService.getAll();
      setRealTeams(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load teams"
      );
    } finally {
      setLoading(false);
    }
  }, []);

 const loadDepartments = useCallback(async () => {
  setDepartmentsLoading(true);
  setDepartmentsError("");

  try {
    const data = await departmentService.getAll();

    setDepartments(data);

    setNewTeamDepartmentId(current =>
      current || data[0]?._id || ""
    );
  } catch (err) {
    setDepartmentsError(
      err instanceof Error
        ? err.message
        : "Unable to load departments"
    );
  } finally {
    setDepartmentsLoading(false);
  }
}, []); 

const handleCreateTeam = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (newTeamName.trim().length < 3) {
    notify("Team name must contain at least 3 characters.");
    return;
  }

  if (!newTeamDepartmentId) {
    notify("Please select a department.");
    return;
  }

  setSaving(true);

  try {
    const result = await teamService.create({
      name: newTeamName.trim(),
      departmentId: newTeamDepartmentId
    });

    setFormOpen(false);
    setNewTeamName("");
    setNewTeamDepartmentId(departments[0]?._id || "");

    notify(result.message || "Response team created successfully.");

    await loadTeams();
  } catch (err) {
    notify(
      err instanceof Error
        ? err.message
        : "Unable to create response team."
    );
  } finally {
    setSaving(false);
  }
};

const openTeamDetails = async (team: ResponseTeam) => {
  setSelectedTeamDetails(team);
  setDetailsLoading(true);
  setDetailsError("");
  setSelectedMemberId("");

  try {
    const [details, users] = await Promise.all([
      teamService.getById(team._id),
      userService.getAll()
    ]);

    setSelectedTeamDetails(details);

    setResponseTeamUsers(
      users.filter(
        user =>
          user.role === "response_team" &&
          user.isActive
      )
    );
  } catch (err) {
    setDetailsError(
      err instanceof Error
        ? err.message
        : "Unable to load team details"
    );
  } finally {
    setDetailsLoading(false);
  }
};

const handleAddTeamMember = async () => {
  if (!selectedTeamDetails || !selectedMemberId) {
    notify("Please select a response team member.");
    return;
  }

  setMemberSaving(true);

  try {
    const result = await teamService.addMember(
      selectedTeamDetails._id,
      selectedMemberId
    );

    setSelectedTeamDetails(result.team);
    setSelectedMemberId("");

    await loadTeams();

    notify(result.message);
  } catch (err) {
    notify(
      err instanceof Error
        ? err.message
        : "Unable to assign team member."
    );
  } finally {
    setMemberSaving(false);
  }
};

const handleRemoveTeamMember = async (userId: string) => {
  if (!selectedTeamDetails) return;

  setMemberSaving(true);

  try {
    const result = await teamService.removeMember(
      selectedTeamDetails._id,
      userId
    );

    setSelectedTeamDetails(result.team);

    await loadTeams();

    notify(result.message);
  } catch (err) {
    notify(
      err instanceof Error
        ? err.message
        : "Unable to remove team member."
    );
  } finally {
    setMemberSaving(false);
  }
};
useEffect(() => {
  void loadTeams();
  void loadDepartments();
}, [loadTeams, loadDepartments]);

  const filteredTeams = realTeams.filter(team => {
    if (tab === "Available") return team.isAvailable;
    if (tab === "On mission") return !team.isAvailable;
    return true;
  });

  const eligibleResponseUsers = responseTeamUsers.filter(user => {
  const assignedToAnotherTeam = realTeams.some(team =>
    team._id !== selectedTeamDetails?._id &&
    team.members?.some(member => member._id === user._id)
  );

  const alreadyInCurrentTeam =
    selectedTeamDetails?.members?.some(
      member => member._id === user._id
    );

  return !assignedToAnotherTeam && !alreadyInCurrentTeam;
});

  return (
    <section className="panel full-panel">
      <div className="panel-head">
        <div>
          <h3>Response units</h3>
          <p>Live team information from the backend</p>
        </div>

<div className="toolbar-right">
  <button
    className="btn btn-primary"
    onClick={() => setFormOpen(true)}
    disabled={
      loading ||
      departmentsLoading ||
      departments.length === 0
    }
  >
    <Plus size={16} />
    Add Team
  </button>

  <button
    className="btn btn-secondary"
    onClick={() => {
      void loadTeams();
      void loadDepartments();
    }}
    disabled={loading || departmentsLoading}
  >
    <RefreshCw size={15} />
    Refresh
  </button>
</div>
      </div>

      <div className="tabs">
        {["All teams", "Available", "On mission"].map(item => (
          <button
            key={item}
            className={tab === item ? "selected" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && (
        <div className="empty-state">
          <b>Loading response teams...</b>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <b>Unable to load response teams</b>
          <span>{error}</span>
          <button className="btn btn-secondary" onClick={() => void loadTeams()}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredTeams.length === 0 && (
        <div className="empty-state">
          <Users size={25} />
          <b>No response teams found</b>
          <span>Teams from your MongoDB database will appear here.</span>
        </div>
      )}

      {!loading && !error && (
        <div className="team-grid">
          {filteredTeams.map(team => (
            <div className="team-card" key={team._id}>
              <div className="team-card-head">
                <div className="team-symbol orange">
                  <Truck size={20} />
                </div>
                <Badge tone={team.isAvailable ? "green" : "orange"}>
                  {team.isAvailable ? "Available" : "Deployed"}
                </Badge>
              </div>

              <h3>{team.name}</h3>

              <p>
                {typeof team.departmentId === "object"
                  ? team.departmentId?.name || "Department unavailable"
                  : "Department unavailable"}
              </p>

              <div className="team-meta">
                <span>
                  <Users size={14} />
                  {team.members?.length || 0} members
                </span>
              </div>

              <div className="team-vehicle">
                <MapPin size={14} />
                {typeof team.currentLocation?.latitude === "number" &&
                typeof team.currentLocation?.longitude === "number"
                  ? `${team.currentLocation.latitude.toFixed(5)}, ${team.currentLocation.longitude.toFixed(5)}`
                  : "GPS location unavailable"}
              </div>

              {team.currentLocation?.updatedAt && (
                <small>
                  Last GPS update:{" "}
                  {new Date(team.currentLocation.updatedAt).toLocaleString()}
                </small>
              )}

<button
  className="team-action"
  onClick={() => void openTeamDetails(team)}
>
  View team information <ChevronRight size={15} />
</button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
  <Modal
    title="Create Response Team"
    close={() => setFormOpen(false)}
  >
    {departmentsLoading ? (
      <div className="empty-state">
        Loading departments...
      </div>
    ) : departmentsError ? (
      <div className="empty-state">
        <b>Unable to load departments</b>
        <span>{departmentsError}</span>
      </div>
    ) : departments.length === 0 ? (
      <div className="empty-state">
        <b>No departments available</b>
        <span>
          Create a department before creating a response team.
        </span>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormOpen(false);
            setPage("Departments");
          }}
        >
          Open Departments
        </button>
      </div>
    ) : (
      <form
        className="form-grid"
        onSubmit={handleCreateTeam}
      >
        <label className="full">
          Team Name
          <input
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="e.g. Medical Emergency Team 1"
            minLength={3}
            maxLength={80}
            required
          />
        </label>

        <label className="full">
          Department
          <select
            value={newTeamDepartmentId}
            onChange={e =>
              setNewTeamDepartmentId(e.target.value)
            }
            required
          >
            <option value="">Select department</option>
            {departments.map(department => (
              <option
                key={department._id}
                value={department._id}
              >
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <p className="full modal-copy">
          New teams will initially be available for assignments.
        </p>

        <div className="modal-actions full">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFormOpen(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !newTeamDepartmentId}
          >
            {saving ? "Creating..." : "Create Team"}
          </button>
        </div>
      </form>
    )}
  </Modal>
)}

{selectedTeamDetails && (
  <Modal
    title="Response Team Details"
    close={() => setSelectedTeamDetails(null)}
  >
    <div className="team-details-grid">

      <div className="full">
        <h3>{selectedTeamDetails.name}</h3>
      </div>

      {detailsLoading && (
        <div className="full">
          <p>Loading latest team details...</p>
        </div>
      )}

      {detailsError && (
        <div className="full">
          <p className="error-text">{detailsError}</p>
        </div>
      )}

      <div>
        <span>Department</span>
        <b>
          {typeof selectedTeamDetails.departmentId === "object"
            ? selectedTeamDetails.departmentId?.name || "Not assigned"
            : selectedTeamDetails.departmentId || "Not assigned"}
        </b>
      </div>

      <div>
        <span>Availability</span>
        <Badge tone={selectedTeamDetails.isAvailable ? "green" : "orange"}>
          {selectedTeamDetails.isAvailable ? "Available" : "On Mission"}
        </Badge>
      </div>

      <div>
        <span>Total Members</span>
        <b>{selectedTeamDetails.members?.length || 0}</b>
      </div>

      <div className="full">
        <span>GPS Coordinates</span>
        <b>
          {typeof selectedTeamDetails.currentLocation?.latitude === "number" &&
          typeof selectedTeamDetails.currentLocation?.longitude === "number"
            ? `${selectedTeamDetails.currentLocation.latitude}, ${selectedTeamDetails.currentLocation.longitude}`
            : "Location unavailable"}
        </b>
      </div>

      <div className="full">
        <span>Last GPS Update</span>
        <b>
          {selectedTeamDetails.currentLocation?.updatedAt
            ? new Date(
                selectedTeamDetails.currentLocation.updatedAt
              ).toLocaleString()
            : "No GPS update"}
        </b>
      </div>

    </div>

<div className="team-members-section full">
  <div className="panel-head">
    <div>
      <h3>Team Members</h3>
      <p>
        {selectedTeamDetails.members?.length || 0} members assigned
      </p>
    </div>
  </div>

  {selectedTeamDetails.members?.length ? (
    <div className="feed-list">
      {selectedTeamDetails.members.map(member => (
        <div className="feed-item" key={member._id}>
          <div>
            <b>{member.name}</b>
            <span>{member.email || "Email unavailable"}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={memberSaving}
            onClick={() => void handleRemoveTeamMember(member._id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <Users size={22} />
      <b>No members assigned</b>
      <span>Assign an active response team user below.</span>
    </div>
  )}

  <form
    className="form-grid"
    onSubmit={event => {
      event.preventDefault();
      void handleAddTeamMember();
    }}
  >
    <label className="full">
      Add Response Team Member

      <select
        value={selectedMemberId}
        onChange={event => setSelectedMemberId(event.target.value)}
        disabled={memberSaving || eligibleResponseUsers.length === 0}
      >
        <option value="">Select a response team user</option>

        {eligibleResponseUsers.map(user => (
          <option key={user._id} value={user._id}>
            {user.name} — {user.email}
          </option>
        ))}
      </select>
    </label>

    {eligibleResponseUsers.length === 0 && (
      <p className="full modal-copy">
        No unassigned active response team users available.
        Create another response team user from the Users page.
      </p>
    )}

    <div className="modal-actions full">
      <button
        type="submit"
        className="btn btn-primary"
        disabled={
          memberSaving ||
          !selectedMemberId ||
          eligibleResponseUsers.length === 0
        }
      >
        {memberSaving ? "Assigning..." : "Assign Member"}
      </button>
    </div>
  </form>
</div>


    <div className="modal-actions">
      <button
        className="btn btn-primary"
        onClick={() => setSelectedTeamDetails(null)}
      >
        Close
      </button>
    </div>
  </Modal>
)}
    </section>
  );
}


function DepartmentsPage({ notify }: any) {
  const { user } = useAuthContext();

  const isAdmin = user?.role === "admin";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");



  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load departments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().length < 3 || description.trim().length < 10) {
      notify("Enter a valid department name and description.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const result = await departmentService.update(editingId, {
          name: name.trim(),
          description: description.trim()
        });

        notify(result.message || "Department updated successfully.");
      } else {
        const result = await departmentService.create({
          name: name.trim(),
          description: description.trim()
        });

        notify(result.message || "Department created successfully.");
      }

      resetForm();
      await loadDepartments();
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Unable to save department."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingId(department._id);
    setName(department.name);
    setDescription(department.description);
    setFormOpen(true);
  };

  const handleDelete = async (department: Department) => {
    const confirmed = window.confirm(
      `Delete department "${department.name}"?`
    );

    if (!confirmed) return;

    try {
      const result = await departmentService.delete(department._id);
      notify(result.message || "Department deleted successfully.");
      await loadDepartments();
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "Unable to delete department."
      );
    }
  };

  return (
    <section className="panel full-panel">
      <div className="panel-head">
        <div>
          <h3>Departments</h3>
          <p>Live department records from MongoDB</p>
        </div>

        <div className="toolbar-right">
          <button
            className="btn btn-secondary"
            onClick={() => void loadDepartments()}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
            >
              <Plus size={15} /> Add department
            </button>
          )}
        </div>
      </div>

      {formOpen && isAdmin && (
        <form
          className="panel"
          style={{ marginTop: "18px" }}
          onSubmit={handleSubmit}
        >
          <h3>{editingId ? "Edit department" : "Create department"}</h3>

          <div className="form-grid" style={{ marginTop: "15px" }}>
            <label className="full">
              Department name
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                minLength={3}
                required
                placeholder="e.g. Fire and Rescue"
              />
            </label>

            <label className="full">
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                minLength={10}
                required
                rows={3}
                placeholder="Describe this department's responsibilities"
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Create department"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="empty-state">
          <b>Unable to load departments</b>
          <span>{error}</span>
          <button
            className="btn btn-secondary"
            onClick={() => void loadDepartments()}
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <b>Loading departments...</b>
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <div className="empty-state">
          <Building2 size={25} />
          <b>No departments found</b>
          <span>Departments created in MongoDB will appear here.</span>
        </div>
      )}

      {!loading && !error && departments.length > 0 && (
        <div className="department-grid" style={{ marginTop: "18px" }}>
          {departments.map(department => (
            <div className="panel department-card" key={department._id}>
              <div className="department-icon blue">
                <Building2 size={20} />
              </div>

              <h3>{department.name}</h3>
              <p>{department.description}</p>

              <small style={{ color: "#8192a9" }}>
                ID: {department._id}
              </small>

              {isAdmin && (
                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(department)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => void handleDelete(department)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AnalyticsPage() {
  const [statistics, setStatistics] =
    useState<DashboardStatistics | null>(null);
    const [deployedTeamCount, setDeployedTeamCount] =
  useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await analyticsService.getDashboard();
      setStatistics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  if (loading) {
    return (
      <section className="panel full-panel">
        <div className="empty-state">
          <b>Loading analytics from database...</b>
        </div>
      </section>
    );
  }

  if (error || !statistics) {
    return (
      <section className="panel full-panel">
        <div className="empty-state">
          <b>Unable to load analytics</b>
          <span>{error || "No analytics data available"}</span>

          <button
            className="btn btn-secondary"
            onClick={() => void loadStatistics()}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const overview = statistics.overview;

  const totalIncidents = overview.totalIncidents;
  const resolvedIncidents = overview.resolvedIncidents;

  const resolutionRate =
    totalIncidents > 0
      ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1)
      : "0.0";

  const totalTeams = statistics.teams.length;

  const availableTeams = statistics.teams.filter(
    team => team.isAvailable
  ).length;

  const teamAvailability =
    totalTeams > 0
      ? ((availableTeams / totalTeams) * 100).toFixed(1)
      : "0.0";

  const criticalCount =
    statistics.priority.find(
      item => item._id.toLowerCase() === "critical"
    )?.count || 0;


  const monthlyTrend = statistics.monthly.map(item => ({
    month: new Date(
      item._id.year,
      item._id.month - 1,
      1
    ).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit"
    }),
    incidents: item.count
  }));


  const categoryColors: Record<string, string> = {
    medical: "#5b8def",
    fire: "#f07862",
    traffic: "#eab95d",
    security: "#a78bfa",
    crime: "#a78bfa",
    accident: "#eab95d",
    other: "#45b8a2"
  };

  const distribution = statistics.category.map(item => ({
    name: item._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : "Other",
    percentage:
      totalIncidents > 0
        ? Math.round((item.count / totalIncidents) * 100)
        : 0,
    color:
      categoryColors[item._id.toLowerCase()] || "#8090a8"
  }));

  const activeNow =
    overview.pendingIncidents +
    overview.verifiedIncidents +
    overview.assignedIncidents;

  return (
    <>
      {}
      <div className="stats-grid">

        <Stat
          icon={Activity}
          label="Total incidents"
          value={totalIncidents.toLocaleString()}
          change="All records"
          tone="blue"
          note="From incident database"
        />

        <Stat
          icon={Clock3}
          label="Avg. response time"
          value="N/A"
          change="Not tracked"
          tone="blue"
          note="Response time is not provided by API"
        />

        <Stat
          icon={CheckCircle2}
          label="Resolution rate"
          value={`${resolutionRate}%`}
          change={`${resolvedIncidents} resolved`}
          tone="green"
          note="Resolved incidents / Total incidents"
        />

        <Stat
          icon={Users}
          label="Team availability"
          value={`${teamAvailability}%`}
          change={`${availableTeams} available`}
          tone="orange"
          note={`Out of ${totalTeams} registered teams`}
        />

      </div>

      {}
      <div className="overview-grid">

        <section className="panel trend-panel">

          <div className="panel-head">
            <div>
              <h3>Monthly incident trend</h3>
              <p>Incident volume by month</p>
            </div>

            <Badge tone="blue">Last 12 months</Badge>
          </div>

          {monthlyTrend.length > 0 ? (
            <div className="chart-area tall">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>

                  <CartesianGrid
                    stroke="#25334a"
                    strokeDasharray="3 5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: "#8090a8",
                      fontSize: 11
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "#8090a8",
                      fontSize: 11
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111c2e",
                      border: "1px solid #2b3b54",
                      borderRadius: 10,
                      color: "#e8eef8"
                    }}
                  />

                  <Bar
                    dataKey="incidents"
                    name="Incidents"
                    fill="#5b8def"
                    radius={[5, 5, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              No monthly incident data available.
            </div>
          )}

        </section>

        <section className="panel distribution-panel">

          <div className="panel-head">
            <div>
              <h3>Category distribution</h3>
              <p>Share of all incidents</p>
            </div>
          </div>

          {distribution.length > 0 ? (
            <div className="distribution-legend large">
              {distribution.map(item => (
                <div key={item.name}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>

                  <b>{item.percentage}%</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No category data available.
            </div>
          )}

        </section>

      </div>

      {/* Operational Snapshot */}
      <section className="panel full-panel">

        <div className="panel-head">
          <div>
            <h3>Current operational snapshot</h3>
            <p>Based on live database statistics</p>
          </div>
        </div>

        <div className="analytics-callouts">

          <div>
            <span>Active now</span>
            <b>{activeNow}</b>
          </div>

          <div>
            <span>Critical priority</span>
            <b>{criticalCount}</b>
          </div>

          <div>
            <span>Resolved</span>
            <b>{resolvedIncidents}</b>
          </div>

          <div>
            <span>Response units</span>
            <b>{totalTeams}</b>
          </div>

        </div>

      </section>
    </>
  );
}
function ReportsPage({ exportCsv, notify }: any) {
  const [statistics, setStatistics] =
    useState<DashboardStatistics | null>(null);
    const [deployedTeamCount, setDeployedTeamCount] =
  useState<number|null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await analyticsService.getDashboard();
      setStatistics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load report data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const downloadReport = (
    filename: string,
    rows: (string | number)[][]
  ) => {
    const csv = rows
      .map(row =>
        row
          .map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    notify(`${filename} downloaded successfully.`);
  };

  const generatePerformanceReport = () => {
    if (!statistics) return;

    const overview = statistics.overview;

    const resolutionRate =
      overview.totalIncidents > 0
        ? (
            (overview.resolvedIncidents /
              overview.totalIncidents) *
            100
          ).toFixed(1)
        : "0.0";

    const rows: (string | number)[][] = [
      ["Section", "Metric", "Value"],

      ["Overview", "Total incidents", overview.totalIncidents],
      ["Overview", "Pending incidents", overview.pendingIncidents],
      ["Overview", "Verified incidents", overview.verifiedIncidents],
      ["Overview", "Assigned incidents", overview.assignedIncidents],
      ["Overview", "Resolved incidents", overview.resolvedIncidents],
      ["Overview", "Resolution rate", `${resolutionRate}%`],

      ...statistics.priority.map(item => [
        "Priority",
        item._id,
        item.count
      ]),

      ...statistics.category.map(item => [
        "Category",
        item._id,
        item.count
      ]),

      ...statistics.monthly.map(item => [
        "Monthly trend",
        `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        item.count
      ])
    ];

    downloadReport("civicpulse-performance-report.csv", rows);
  };

  const generateTeamReport = () => {
    if (!statistics) return;

    const rows: (string | number)[][] = [
      [
        "Team",
        "Department ID",
        "Members",
        "Availability",
        "Total Incidents Handled",
        "Resolved",
        "Currently Assigned"
      ],

      ...statistics.teams.map(team => [
        team.name,
        team.departmentId || "Not assigned",
        team.memberCount,
        team.isAvailable ? "Available" : "On Mission",
        team.totalIncidentsHandled,
        team.resolved,
        team.currentlyAssigned
      ])
    ];

    downloadReport("civicpulse-team-utilization.csv", rows);
  };

  return (
    <section className="panel full-panel">

      <div className="panel-head">
        <div>
          <h3>Operational reports</h3>
          <p>
            Generate and export reports using live backend data.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => void loadReports()}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          <b>Loading report data...</b>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <b>Unable to load reports</b>
          <span>{error}</span>

          <button
            className="btn btn-secondary"
            onClick={() => void loadReports()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && statistics && (
        <div className="report-grid">

          <div className="report-card">
            <FileText size={22} />

            <h3>Incident register</h3>

            <p>
              Export incident records with priority, status,
              location and assigned unit.
            </p>

            <button
              className="btn btn-secondary"
              onClick={exportCsv}
            >
              <Download size={15} />
              Download CSV
            </button>
          </div>

          <div className="report-card">
            <BarChart3 size={22} />

            <h3>Incident performance</h3>

            <p>
              Export incident overview, resolution rate,
              priority, category and monthly statistics.
            </p>

            <button
              className="btn btn-secondary"
              onClick={generatePerformanceReport}
            >
              <Download size={15} />
              Generate report
            </button>
          </div>

          <div className="report-card">
            <Users size={22} />

            <h3>Team utilization</h3>

            <p>
              Export team availability, members, incidents
              handled and mission progress.
            </p>

            <button
              className="btn btn-secondary"
              onClick={generateTeamReport}
            >
              <Download size={15} />
              Generate report
            </button>
          </div>

        </div>
      )}

    </section>
  );
}
function SettingsPage({notify}:any){const [toggles,setToggles]=useState([true,true,false,true]);const labels=['Real-time incident alerts','Critical priority notifications','Daily operational digest','Team status updates'];return <section className="panel settings-panel"><div className="panel-head"><div><h3>Workspace preferences</h3><p>Configure your command center experience.</p></div><Badge tone="green">Saved locally</Badge></div><div className="settings-section"><h4>Notification preferences</h4>{labels.map((l,i)=><div className="setting-row"><div><b>{l}</b><span>Control whether this workspace sends this type of notification.</span></div><button className={`toggle ${toggles[i]?'on':''}`} onClick={()=>setToggles(toggles.map((v,j)=>j===i?!v:v))}><i/></button></div>)}</div><div className="settings-section"><h4>Operational defaults</h4><div className="setting-row"><div><b>Default incident priority</b><span>Priority applied when creating a new incident.</span></div><select defaultValue="High"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div><div className="setting-row"><div><b>Map refresh interval</b><span>How often live operations refreshes.</span></div><select defaultValue="30 seconds"><option>10 seconds</option><option>30 seconds</option><option>1 minute</option></select></div></div><div className="modal-actions"><button className="btn btn-primary" onClick={()=>notify('Workspace preferences saved.')}>Save preferences <Check size={15}/></button></div></section>}
export default App;
