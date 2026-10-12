import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Info,
  Building,
  Briefcase
} from 'lucide-react';
import { useBimData } from '../context/BimDataContext';
import {
  Discipline,
  LODLevel,
  BimTaskType,
  AllocationPriority,
  ResourceAllocationItem,
  BimProject,
  Employee
} from '../types';

interface AssignHoursSystemProps {
  onSelectProject?: (project: BimProject) => void;
}

const matchProjectId = (idA?: string, idB?: string): boolean => {
  if (!idA || !idB) return false;
  if (idA === idB) return true;
  const normA = idA.startsWith('proj-') ? idA : idA.replace(/^p(\d+)$/, 'proj-$1');
  const normB = idB.startsWith('proj-') ? idB : idB.replace(/^p(\d+)$/, 'proj-$1');
  return normA === normB;
};

const INITIAL_ALLOCATIONS: ResourceAllocationItem[] = [
  {
    id: 'alloc-1',
    projectId: 'proj-1',
    projectName: 'London Wall Gym',
    employeeId: 'emp-2',
    employeeName: 'Sushovan Das',
    employeeRole: 'BIM Coordinator',
    memberEmail: 'sushovan.das@bimworkspace.com',
    discipline: 'Coordination & QA',
    lod: 'LOD 350',
    projectPhase: 'Design Development',
    taskType: 'QC/QA Audit',
    targetElementOrZone: 'AR-LVL01-GYM-ZONE-A',
    assignedHours: 16,
    viewFrequency: 'Weekly',
    startDate: '2026-08-17',
    dueDate: '2026-08-21',
    priority: 'High',
    status: 'In Progress',
    notes: 'Multi-discipline clash verification and coordination audit'
  },
  {
    id: 'alloc-2',
    projectId: 'proj-1',
    projectName: 'London Wall Gym',
    employeeId: 'emp-aditi',
    employeeName: 'Aditi',
    employeeRole: 'BIM Modeler',
    memberEmail: 'aditi@bimworkspace.com',
    discipline: 'BIM - ACS',
    lod: 'LOD 300',
    projectPhase: 'Design Development',
    taskType: '3D Modeling',
    targetElementOrZone: 'AR-LVL01-GYM-ZONE-A',
    assignedHours: 18,
    viewFrequency: 'Weekly',
    startDate: '2026-08-17',
    dueDate: '2026-08-22',
    priority: 'High',
    status: 'In Progress',
    notes: 'Acoustic wall paneling and mezzanine framing modeling'
  },
  {
    id: 'alloc-3',
    projectId: 'proj-2',
    projectName: 'Watermark Podium Garage',
    employeeId: 'emp-2',
    employeeName: 'Sushovan Das',
    employeeRole: 'BIM Coordinator',
    memberEmail: 'sushovan.das@bimworkspace.com',
    discipline: 'Coordination & QA',
    lod: 'LOD 350',
    projectPhase: 'Construction Documentation',
    taskType: 'Clash Detection',
    targetElementOrZone: 'MEP-LVL02-PODIUM-B',
    assignedHours: 18,
    viewFrequency: 'Weekly',
    startDate: '2026-08-17',
    dueDate: '2026-08-22',
    priority: 'Critical',
    status: 'In Progress',
    notes: 'HVAC duct vs plumbing riser clash mitigation'
  },
  {
    id: 'alloc-4',
    projectId: 'proj-3',
    projectName: 'New Bugesera International Airport',
    employeeId: 'emp-2',
    employeeName: 'Sushovan Das',
    employeeRole: 'BIM Coordinator',
    memberEmail: 'sushovan.das@bimworkspace.com',
    discipline: 'Coordination & QA',
    lod: 'LOD 400',
    projectPhase: 'Fabrication / As-Built',
    taskType: 'QC/QA Audit',
    targetElementOrZone: 'QA-TERMINAL-ZONE-NORTH',
    assignedHours: 32,
    viewFrequency: 'Weekly',
    startDate: '2026-08-17',
    dueDate: '2026-08-25',
    priority: 'High',
    status: 'In Progress',
    notes: 'LOD 400 fabrication check and COBie schema review'
  },
  {
    id: 'alloc-5',
    projectId: 'proj-3',
    projectName: 'New Bugesera International Airport',
    employeeId: 'emp-aditi',
    employeeName: 'Aditi',
    employeeRole: 'BIM Modeler',
    memberEmail: 'aditi@bimworkspace.com',
    discipline: 'BIM - ACS',
    lod: 'LOD 350',
    projectPhase: 'Construction Documentation',
    taskType: '3D Modeling',
    targetElementOrZone: 'ST-CONCOURSE-TRUSS-04',
    assignedHours: 24,
    viewFrequency: 'Weekly',
    startDate: '2026-08-18',
    dueDate: '2026-08-24',
    priority: 'Medium',
    status: 'In Progress',
    notes: 'Curved roof trusses and perimeter glazing anchors'
  }
];

export const AssignHoursSystem: React.FC<AssignHoursSystemProps> = ({ onSelectProject }) => {
  const { projects, employees, workLogs, theme } = useBimData();
  const isLight = theme === 'light';
  const activeMembers = employees;

  // Helper to test if allocation belongs to a live active team member
  const isLiveActiveMember = (item: ResourceAllocationItem) => {
    if (item.memberEmail) {
      const matchByEmail = activeMembers.some(
        (m) => m.email.toLowerCase().trim() === item.memberEmail?.toLowerCase().trim()
      );
      if (!matchByEmail) return false;
    }
    return activeMembers.some(
      (m) =>
        m.id === item.employeeId ||
        (item.employeeName && m.name.toLowerCase().trim() === item.employeeName.toLowerCase().trim())
    );
  };

  // State
  const [allocations, setAllocations] = useState<ResourceAllocationItem[]>(() => {
    const saved = localStorage.getItem('bim_resource_allocations_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed
            .filter((item: ResourceAllocationItem) => {
              const name = (item.employeeName || '').toLowerCase();
              const id = item.employeeId || '';
              const email = (item.memberEmail || '').toLowerCase();
              return (
                name.includes('sushovan') ||
                name.includes('sushoovan') ||
                name.includes('aditi') ||
                id === 'emp-2' ||
                id === 'emp-aditi' ||
                email.includes('sushovan') ||
                email.includes('aditi')
              );
            })
            .map((item: ResourceAllocationItem) => ({
              ...item,
              projectId: item.projectId.startsWith('proj-') ? item.projectId : item.projectId.replace(/^p(\d+)$/, 'proj-$1')
            }));
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        return INITIAL_ALLOCATIONS;
      }
    }
    return INITIAL_ALLOCATIONS;
  });

  // Sync allocations with activeMembers collection
  useEffect(() => {
    setAllocations((prev) => {
      const filtered = prev.filter(isLiveActiveMember);
      if (filtered.length !== prev.length) {
        localStorage.setItem('bim_resource_allocations_v1', JSON.stringify(filtered));
      }
      return filtered;
    });

    const handleAllocUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAllocations(e.detail.filter(isLiveActiveMember));
      }
    };
    window.addEventListener('bim_resource_allocations_updated', handleAllocUpdate);
    return () => {
      window.removeEventListener('bim_resource_allocations_updated', handleAllocUpdate);
    };
  }, [activeMembers]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFrequency, setViewFrequency] = useState<'Daily' | 'Weekly'>('Weekly');

  // Modal / Add Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Inputs
  const [formProject, setFormProject] = useState(projects[0]?.id || 'p1');
  const [formEmployee, setFormEmployee] = useState(employees[0]?.id || 'emp-2');
  const [formDiscipline, setFormDiscipline] = useState<ResourceAllocationItem['discipline']>('BIM - ACS');
  const [formLOD, setFormLOD] = useState<ResourceAllocationItem['lod']>('LOD 350');
  const [formPhase, setFormPhase] = useState<ResourceAllocationItem['projectPhase']>('Design Development');
  const [formTaskType, setFormTaskType] = useState<BimTaskType>('3D Modeling');
  const [formTargetZone, setFormTargetZone] = useState('MOD-AR-LVL01-ZONE-A');
  const [formHours, setFormHours] = useState<number>(20);
  const [formStartDate, setFormStartDate] = useState('2026-08-17');
  const [formDueDate, setFormDueDate] = useState('2026-08-21');
  const [formPriority, setFormPriority] = useState<AllocationPriority>('High');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Persist allocations
  const saveAllocations = (newAllocations: ResourceAllocationItem[]) => {
    setAllocations(newAllocations);
    localStorage.setItem('bim_resource_allocations_v1', JSON.stringify(newAllocations));
  };

  // Sync allocations with Relational SQL Database
  useEffect(() => {
    fetch('/api/project-assignments')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: ResourceAllocationItem[] = json.data.map((item: any) => {
            const proj = projects.find((p) => p.id === item.projectId);
            const emp = employees.find((e) => e.id === item.userId);
            return {
              id: item.id,
              projectId: item.projectId,
              projectName: proj?.name || 'BIM Project',
              employeeId: item.userId,
              employeeName: emp?.name || 'BIM Specialist',
              employeeRole: emp?.role || 'BIM Modeler',
              memberEmail: emp?.email,
              discipline: (emp?.primaryDiscipline as any) || 'BIM - ACS',
              lod: 'LOD 350',
              projectPhase: 'Design Development',
              taskType: '3D Modeling',
              targetElementOrZone: 'Zone A',
              assignedHours: Number(item.assignedHours) || 0,
              viewFrequency: 'Weekly',
              startDate: item.startDate || '2026-08-17',
              dueDate: item.dueDate || '2026-08-25',
              priority: 'High',
              status: 'In Progress',
            };
          });
          setAllocations(mapped);
        }
      })
      .catch((err) => console.warn('Fetch SQL assignments notice:', err));
  }, [projects, employees]);

  // Helper to get live active allocations strictly filtered against activeMembers
  const liveActiveAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (a.memberEmail && !activeMembers.some((m) => m.email.toLowerCase().trim() === a.memberEmail?.toLowerCase().trim())) {
        return false;
      }
      return activeMembers.some(
        (m) =>
          m.id === a.employeeId ||
          (a.employeeName && m.name.toLowerCase().trim() === a.employeeName.toLowerCase().trim())
      );
    });
  }, [allocations, activeMembers]);

  // Helper to get total weekly hours assigned to an employee
  const getEmployeeWeeklyHours = useMemo(() => {
    const map: Record<string, number> = {};
    liveActiveAllocations.forEach((alloc) => {
      if (alloc.status !== 'Completed') {
        map[alloc.employeeId] = (map[alloc.employeeId] || 0) + Number(alloc.assignedHours || 0);
      }
    });
    return map;
  }, [liveActiveAllocations]);

  // Overall Workspace Metrics & Efficiency Dashboard based on table parameters
  const workspaceMetrics = useMemo(() => {
    let budgetHours = 0;
    if (selectedProjectId === 'all') {
      if (selectedEmployeeId !== 'all') {
        const emp = employees.find((e) => e.id === selectedEmployeeId);
        budgetHours = emp?.weeklyCapacityHours || 40;
      } else {
        budgetHours = projects.reduce((sum, p) => sum + (p.totalEstimatedHours || 0), 0);
      }
    } else {
      const proj = projects.find((p) => matchProjectId(p.id, selectedProjectId));
      budgetHours = proj?.totalEstimatedHours || 0;
    }

    const relevantAllocations = selectedProjectId === 'all'
      ? liveActiveAllocations
      : liveActiveAllocations.filter((a) => matchProjectId(a.projectId, selectedProjectId));

    const filteredByEmployee = selectedEmployeeId === 'all'
      ? relevantAllocations
      : relevantAllocations.filter((a) => a.employeeId === selectedEmployeeId);

    const allocatedHours = filteredByEmployee.reduce((sum, a) => sum + (Number(a.assignedHours) || 0), 0);

    // Calculate total logged hours matching the current allocation scope
    const loggedHours = filteredByEmployee.reduce((sum, alloc) => {
      const rowLogged = workLogs
        .filter((w) => w.employeeId === alloc.employeeId && matchProjectId(w.projectId, alloc.projectId))
        .reduce((wSum, w) => wSum + (Number(w.hoursLogged) || 0), 0);
      return sum + rowLogged;
    }, 0);

    // Dynamic Available Remaining Hours: Assigned Hours - Logged Hours
    const remainingHours = Number((allocatedHours - loggedHours).toFixed(1));
    const utilizationPct = budgetHours > 0 ? Math.round((allocatedHours / budgetHours) * 100) : 0;

    // Efficiency & Status Metrics
    const completedTasks = filteredByEmployee.filter((a) => a.status === 'Completed');
    const completedHours = completedTasks.reduce((sum, a) => sum + (Number(a.assignedHours) || 0), 0);
    const inProgressTasks = filteredByEmployee.filter((a) => a.status === 'In Progress');
    const inProgressHours = inProgressTasks.reduce((sum, a) => sum + (Number(a.assignedHours) || 0), 0);
    const criticalTasks = filteredByEmployee.filter((a) => a.priority === 'Critical' || a.priority === 'High');
    const delayedTasks = filteredByEmployee.filter((a) => a.status === 'Delayed');

    const completionRate = allocatedHours > 0 ? Math.round((completedHours / allocatedHours) * 100) : 0;

    // Discipline breakdown
    const disciplineBreakdown: Record<string, number> = {
      Architectural: 0,
      Structural: 0,
      MEP: 0,
      Infrastructure: 0,
      'Coordination & QA': 0
    };

    filteredByEmployee.forEach((a) => {
      if (disciplineBreakdown[a.discipline] !== undefined) {
        disciplineBreakdown[a.discipline] += Number(a.assignedHours || 0);
      }
    });

    // Priority breakdown
    const priorityBreakdown = {
      Critical: filteredByEmployee.filter(a => a.priority === 'Critical').length,
      High: filteredByEmployee.filter(a => a.priority === 'High').length,
      Medium: filteredByEmployee.filter(a => a.priority === 'Medium').length,
      Low: filteredByEmployee.filter(a => a.priority === 'Low').length,
    };

    // Overallocated staff count
    const overallocatedStaff = Object.entries(getEmployeeWeeklyHours).filter(([_, hrs]) => Number(hrs) > 40).length;

    return {
      budgetHours,
      allocatedHours,
      loggedHours,
      remainingHours,
      utilizationPct,
      disciplineBreakdown,
      overallocatedStaff,
      completedHours,
      inProgressHours,
      completedCount: completedTasks.length,
      inProgressCount: inProgressTasks.length,
      delayedCount: delayedTasks.length,
      criticalCount: criticalTasks.length,
      completionRate,
      priorityBreakdown
    };
  }, [projects, employees, liveActiveAllocations, workLogs, selectedProjectId, selectedEmployeeId, getEmployeeWeeklyHours]);

  // Filtered Allocations based on 2 Dropdowns (Project + Team Member) and Search
  const filteredAllocations = useMemo(() => {
    return liveActiveAllocations.filter((a) => {
      const matchesProj = selectedProjectId === 'all' || matchProjectId(a.projectId, selectedProjectId);
      const matchesEmp = selectedEmployeeId === 'all' || a.employeeId === selectedEmployeeId;
      const matchesDisc = filterDiscipline === 'all' || a.discipline === filterDiscipline;
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || a.priority === filterPriority;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        a.projectName.toLowerCase().includes(q) ||
        a.employeeName.toLowerCase().includes(q) ||
        a.employeeRole.toLowerCase().includes(q) ||
        a.discipline.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.priority.toLowerCase().includes(q);

      return matchesProj && matchesEmp && matchesDisc && matchesStatus && matchesPriority && matchesSearch;
    });
  }, [liveActiveAllocations, selectedProjectId, selectedEmployeeId, filterDiscipline, filterStatus, filterPriority, searchQuery]);

  // Handle Form Submission
  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation Guards
    if (formHours <= 0) {
      setFormError('Assigned hours must be greater than 0.');
      return;
    }
    if (new Date(formDueDate) < new Date(formStartDate)) {
      setFormError('Due date cannot be earlier than start date.');
      return;
    }
    if (!formTargetZone.trim()) {
      setFormError('Target Model Element / Zone ID is required.');
      return;
    }

    const proj = projects.find((p) => p.id === formProject) || projects[0];
    const emp = employees.find((e) => e.id === formEmployee) || employees[0];

    const newItem: ResourceAllocationItem = {
      id: `alloc-${Date.now()}`,
      projectId: proj.id,
      projectName: proj.name,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      memberEmail: emp.email,
      discipline: formDiscipline,
      lod: formLOD,
      projectPhase: formPhase,
      taskType: formTaskType,
      targetElementOrZone: formTargetZone.trim(),
      assignedHours: Number(formHours),
      viewFrequency,
      startDate: formStartDate,
      dueDate: formDueDate,
      priority: formPriority,
      status: 'Allocated',
      notes: formNotes
    };

    saveAllocations([newItem, ...allocations]);
    setShowAddModal(false);
    setFormNotes('');

    // Persist to Relational SQL Database
    fetch('/api/project-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: proj.id,
        userId: emp.id,
        assignedHours: Number(formHours),
        startDate: formStartDate,
        dueDate: formDueDate,
      }),
    }).catch((err) => console.warn('SQL assignment create notice:', err));
  };

  // Inline Quick Update for hours
  const handleInlineHoursChange = (id: string, newHours: number) => {
    if (newHours < 0) return;
    const updated = allocations.map((a) => (a.id === id ? { ...a, assignedHours: newHours } : a));
    saveAllocations(updated);
    fetch(`/api/project-assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedHours: newHours }),
    }).catch((err) => console.warn('SQL assignment update notice:', err));
  };

  // Inline Priority Update
  const handleInlinePriorityChange = (id: string, priority: AllocationPriority) => {
    const updated = allocations.map((a) => (a.id === id ? { ...a, priority } : a));
    saveAllocations(updated);
  };

  // Inline Status Update
  const handleInlineStatusChange = (id: string, status: ResourceAllocationItem['status']) => {
    const updated = allocations.map((a) => (a.id === id ? { ...a, status } : a));
    saveAllocations(updated);
  };

  // Delete Allocation
  const handleDeleteAllocation = (id: string) => {
    const updated = allocations.filter((a) => a.id !== id);
    saveAllocations(updated);
    fetch(`/api/project-assignments/${id}`, { method: 'DELETE' }).catch((err) =>
      console.warn('SQL assignment delete notice:', err)
    );
  };

  // Discipline Badge Styles
  const getDisciplineBadge = (disc: string) => {
    switch (disc) {
      case 'Architectural':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Structural':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'MEP':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Infrastructure':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Coordination & QA':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  // Priority Badge Styles
  const getPriorityBadge = (priority: AllocationPriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Low':
        return 'bg-slate-700/50 text-slate-400 border border-slate-600/50';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. WORKSPACE & METRICS HEADER */}
      <div className={`p-5 rounded-2xl border ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                BIM Efficiency & Resource Engine
              </span>
              {workspaceMetrics.overallocatedStaff > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  {workspaceMetrics.overallocatedStaff} Overallocated Specialists
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2">
              Assign Hours System
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Track allocated hours, timeline efficiency, delivery throughput, and specialist capacities across all BIM disciplines.
            </p>
          </div>

          {/* Action & View Frequency */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Daily / Weekly toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setViewFrequency('Daily')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  viewFrequency === 'Daily' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewFrequency('Weekly')}
                className={`px-3 py-1 rounded font-semibold transition ${
                  viewFrequency === 'Weekly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weekly
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Hours</span>
            </button>
          </div>
        </div>

        {/* Primary Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-5 border-t border-slate-800">
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned / Allocated Hours
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl font-bold text-blue-400 font-mono">
                {workspaceMetrics.allocatedHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
              </div>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${Math.min(100, workspaceMetrics.utilizationPct)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Available Remaining Hours
              </span>
              <span className="text-[9px] font-semibold text-slate-400 font-mono bg-slate-750 px-1.5 py-0.5 rounded border border-slate-700/50">
                Assigned − Logged
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className={`text-xl font-bold font-mono ${
                workspaceMetrics.remainingHours < 0
                  ? 'text-rose-400'
                  : workspaceMetrics.remainingHours < 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {workspaceMetrics.remainingHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
              </div>
              <CheckCircle2 className={`w-4 h-4 ${
                workspaceMetrics.remainingHours < 0
                  ? 'text-rose-400'
                  : workspaceMetrics.remainingHours < 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{workspaceMetrics.allocatedHours.toFixed(1)}h assigned − {workspaceMetrics.loggedHours.toFixed(1)}h logged</span>
              <span className="font-mono text-slate-500">
                {workspaceMetrics.allocatedHours > 0
                  ? `${Math.round((workspaceMetrics.loggedHours / workspaceMetrics.allocatedHours) * 100)}% logged`
                  : '0% logged'}
              </span>
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Efficiency & Completion
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-xl font-bold text-purple-400 font-mono">
                {workspaceMetrics.completionRate}%
              </div>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {workspaceMetrics.completedHours}h completed / {workspaceMetrics.inProgressHours}h in progress
            </p>
          </div>
        </div>
      </div>

      {/* REDESIGNED SEARCH & 2-DROPDOWN FILTER SYSTEM */}
      <div className={`p-4 rounded-xl border flex flex-col lg:flex-row items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignee, project, discipline, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
          />
        </div>

        {/* 2-Dropdown Filter System (Project Dropdown + Team Member Dropdown) */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end text-xs">
          {/* Dropdown 1: Project Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Team Member Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Team Member:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Team Members ({employees.length})</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="bg-slate-900">
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Clear Filters button if filtered */}
          {(selectedProjectId !== 'all' || selectedEmployeeId !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedProjectId('all');
                setSelectedEmployeeId('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. EFFICIENCY MANAGEMENT DATA GRID TABLE */}
      <div className={`rounded-xl border overflow-hidden shadow-sm ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
              <tr>
                <th className="py-3 px-3.5 min-w-[200px]">Team Member</th>
                <th className="py-3 px-3 min-w-[130px]">Assigned Hours</th>
                <th className="py-3 px-3 min-w-[130px]">Logged Hours</th>
                <th className="py-3 px-3 min-w-[160px]">Timeline (Start - Due)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-normal">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-400">No resource hour allocations found.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the Project or Team Member filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((alloc) => {
                  if (alloc.memberEmail && !activeMembers.some((m) => m.email === alloc.memberEmail)) return null;
                  if (!activeMembers.some((m) => m.id === alloc.employeeId || (alloc.employeeName && m.name.toLowerCase().trim() === alloc.employeeName.toLowerCase().trim()))) return null;

                  const loggedHours = workLogs
                    .filter((w) => w.employeeId === alloc.employeeId && matchProjectId(w.projectId, alloc.projectId))
                    .reduce((sum, w) => sum + (Number(w.hoursLogged) || 0), 0);

                  return (
                    <tr
                      key={alloc.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      {/* Team Member (Name and avatar only, no designation, no capacity indicators) */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-xs">
                            {alloc.employeeName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-[13px]">
                              {alloc.employeeName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Hours (Inline Editable) */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={alloc.assignedHours}
                            onChange={(e) => handleInlineHoursChange(alloc.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs font-mono font-bold rounded bg-slate-800 border border-slate-700 text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] text-slate-400">hrs</span>
                        </div>
                      </td>

                      {/* Logged Hours */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{loggedHours.toFixed(1)} hrs</span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{alloc.startDate}</span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span>{alloc.dueDate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ALLOCATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  Assign BIM Task & Resource Hours
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allocate hours to team specialists with automatic capacity verification.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAllocation} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Project & Specialist Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target BIM Project *
                  </label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assignee Specialist *
                  </label>
                  <select
                    value={formEmployee}
                    onChange={(e) => setFormEmployee(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {employees.map((e) => {
                      const weekly = getEmployeeWeeklyHours[e.id] || 0;
                      const isOver = weekly >= 40;
                      return (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.role}) — {weekly}h / 40h {isOver ? '⚠️' : '✅'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Task Type & Target Zone Element */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    BIM Task Type *
                  </label>
                  <select
                    value={formTaskType}
                    onChange={(e) => setFormTaskType(e.target.value as BimTaskType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="3D Modeling">3D Modeling</option>
                    <option value="Clash Detection">Clash Detection</option>
                    <option value="Parameter Population">Parameter Population</option>
                    <option value="2D Sheet Generation">2D Sheet Generation</option>
                    <option value="QC/QA Audit">QC/QA Audit</option>
                    <option value="COBie Data Entry">COBie Data Entry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Model / Element / Zone ID *
                  </label>
                  <input
                    type="text"
                    value={formTargetZone}
                    onChange={(e) => setFormTargetZone(e.target.value)}
                    placeholder="e.g. MOD-MEP-LVL02-ZONE-B"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Discipline, LOD & Phase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    BIM Discipline
                  </label>
                  <select
                    value={formDiscipline}
                    onChange={(e) => setFormDiscipline(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BIM - ACS">BIM - ACS</option>
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Coordination & QA">Coordination & QA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    LOD Level
                  </label>
                  <select
                    value={formLOD}
                    onChange={(e) => setFormLOD(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOD 200">LOD 200</option>
                    <option value="LOD 300">LOD 300</option>
                    <option value="LOD 350">LOD 350</option>
                    <option value="LOD 400">LOD 400</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Project Phase
                  </label>
                  <select
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Schematic Design">Schematic Design</option>
                    <option value="Design Development">Design Development</option>
                    <option value="Construction Documentation">Construction Documentation</option>
                    <option value="Fabrication / As-Built">Fabrication / As-Built</option>
                  </select>
                </div>
              </div>

              {/* Hours, Priority, Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assigned Hours *
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={formHours}
                    onChange={(e) => setFormHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as AllocationPriority)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deliverable Notes / Model Specifics
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Include Navisworks clash checks and family parameter population..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Allocate Hours</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
