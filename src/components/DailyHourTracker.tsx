import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Download,
  Building,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useBimData } from '../context/BimDataContext';
import { DailyWorkLog, Discipline, ActivityType } from '../types';

interface DailyHourTrackerProps {
  onOpenLogModal: () => void;
}

export const DailyHourTracker: React.FC<DailyHourTrackerProps> = ({
  onOpenLogModal,
}) => {
  const {
    workLogs,
    employees,
    projects,
    deleteWorkLog,
    getEmployeeLoggedHours,
  } = useBimData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2026-08-18');
  const [activeView, setActiveView] = useState<'matrix' | 'logs'>('matrix');

  // Days for the current week (August 12 to August 18, 2026)
  const weekDays = [
    { date: '2026-08-12', label: 'Wed', dayNum: '12' },
    { date: '2026-08-13', label: 'Thu', dayNum: '13' },
    { date: '2026-08-14', label: 'Fri', dayNum: '14' },
    { date: '2026-08-15', label: 'Sat', dayNum: '15' },
    { date: '2026-08-16', label: 'Sun', dayNum: '16' },
    { date: '2026-08-17', label: 'Mon', dayNum: '17' },
    { date: '2026-08-18', label: 'Tue (Today)', dayNum: '18' },
  ];

  const activeMembers = employees;

  // Filtered log list
  const filteredLogs = (workLogs || []).filter((log) => {
    // Live active team member filtering
    const isActive = activeMembers.some(
      (m) =>
        m.id === log.employeeId ||
        (log.employeeName && m.name.toLowerCase().trim() === log.employeeName.toLowerCase().trim()) ||
        ((log as any).memberEmail && m.email.toLowerCase().trim() === ((log as any).memberEmail || '').toLowerCase().trim())
    );
    if (!isActive) return false;

    const matchesSearch =
      (log.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.taskName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.projectName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEmp =
      selectedEmployeeFilter === 'all' || log.employeeId === selectedEmployeeFilter;
    const matchesProj =
      selectedProjectFilter === 'all' || log.projectId === selectedProjectFilter;
    const matchesDisc =
      selectedDisciplineFilter === 'all' || log.discipline === selectedDisciplineFilter;

    return matchesSearch && matchesEmp && matchesProj && matchesDisc;
  });

  const totalFilteredHours = filteredLogs.reduce((sum, l) => sum + (l.hoursLogged || 0), 0);

  // Export to CSV function
  const exportLogsToCsv = () => {
    const headers = ['Date', 'Employee', 'Project', 'Discipline', 'Activity', 'Task', 'LOD', 'Hours', 'Billable', 'Notes'];
    const rows = filteredLogs.map(l => [
      l.date,
      `"${l.employeeName || ''}"`,
      `"${l.projectName || ''}"`,
      `"${l.discipline || ''}"`,
      `"${l.activityType || ''}"`,
      `"${l.taskName || ''}"`,
      l.lodStage,
      l.hoursLogged,
      l.billable ? 'Yes' : 'No',
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BIM_Timesheet_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Daily Hour Tracking
            </h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Organizational Timesheets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking daily modeler work hours, multi-project tasks, and weekly employee capacity utilization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLogsToCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenLogModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Hours</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Logged (Filtered)</span>
            <p className="text-2xl font-bold text-white mt-1">{totalFilteredHours.toFixed(1)} hrs</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Logged Entries</span>
            <p className="text-2xl font-bold text-white mt-1">{filteredLogs.length} Records</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Active Engaged Staff</span>
            <p className="text-2xl font-bold text-white mt-1">{employees.length} Specialists</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs for Matrix vs Log Stream */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'matrix'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Weekly Timesheet Matrix
          </button>
          <button
            onClick={() => setActiveView('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Detailed Log Records ({filteredLogs.length})
          </button>
        </div>
      </div>

      {/* Matrix View: Employee rows across days of the week */}
      {activeView === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 bg-slate-800/40">
            <span className="font-semibold text-white">
              Weekly Team Timesheet Matrix (Aug 12 - Aug 18, 2026)
            </span>
            <span className="text-slate-400">Standard Target: 40.0 hrs / week</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3.5 min-w-[200px]">Employee & Role</th>
                  {weekDays.map((d) => (
                    <th key={d.date} className="p-3.5 text-center min-w-[80px]">
                      <div>{d.label}</div>
                      <div className="text-[10px] text-slate-500">{d.dayNum}</div>
                    </th>
                  ))}
                  <th className="p-3.5 text-right font-bold min-w-[100px]">Weekly Total</th>
                  <th className="p-3.5 text-center min-w-[100px]">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {employees.map((emp) => {
                  let weekSum = 0;
                  const dailyHours = weekDays.map((d) => {
                    const dayLogs = workLogs.filter(
                      (w) => w.employeeId === emp.id && w.date === d.date
                    );
                    const hours = dayLogs.reduce((sum, l) => sum + l.hoursLogged, 0);
                    weekSum += hours;
                    return { date: d.date, hours };
                  });

                  const capPct = Math.round((weekSum / emp.weeklyCapacityHours) * 100);
                  const isOver = weekSum > emp.weeklyCapacityHours;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div>
                          <div className="font-bold text-white">{emp.name}</div>
                          <div className="text-[11px] text-slate-400">{emp.role}</div>
                        </div>
                      </td>

                      {dailyHours.map((d) => (
                        <td key={d.date} className="p-3.5 text-center">
                          {d.hours > 0 ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
                                d.hours >= 8
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {d.hours.toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono">-</span>
                          )}
                        </td>
                      ))}

                      <td className="p-3.5 text-right font-bold text-sm text-white">
                        {weekSum.toFixed(1)}h
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isOver
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : capPct >= 80
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {capPct}% {isOver && '⚡'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Log Stream */}
      {activeView === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Search Keywords</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Task, notes, names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Filter by Project</label>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Filter by Employee</label>
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Filter by Discipline</label>
              <select
                value={selectedDisciplineFilter}
                onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Disciplines</option>
                <option value="BIM - ACS">BIM - ACS</option>
                <option value="Structure">Structure</option>
                <option value="MEP - HVAC">MEP - HVAC</option>
                <option value="MEP - Electrical">MEP - Electrical</option>
                <option value="MEP - Plumbing">MEP - Plumbing</option>
                <option value="Façade / Envelope">Façade / Envelope</option>
                <option value="Coordination & QA">Coordination & QA</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Project & Task</th>
                    <th className="p-3.5">Discipline & LOD</th>
                    <th className="p-3.5">Activity Type</th>
                    <th className="p-3.5">Hours</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLogs.map((log) => {
                    const isActive = activeMembers.some(
                      (m) =>
                        m.id === log.employeeId ||
                        (log.employeeName && m.name.toLowerCase().trim() === log.employeeName.toLowerCase().trim()) ||
                        ((log as any).memberEmail && m.email.toLowerCase().trim() === ((log as any).memberEmail || '').toLowerCase().trim())
                    );
                    if (!isActive) return null;

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="p-3.5 font-medium text-white whitespace-nowrap">
                        {log.employeeName}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{log.projectName}</div>
                        <div className="text-[11px] text-slate-400">{log.taskName}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {log.discipline}
                        </span>
                        <span className="ml-1 text-indigo-400 font-bold text-[10px]">
                          {log.lodStage}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {log.activityType}
                      </td>
                      <td className="p-3.5 font-bold text-blue-400 text-sm whitespace-nowrap">
                        {log.hoursLogged} hrs
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={log.notes}>
                        {log.notes}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Delete this work log entry?')) {
                              deleteWorkLog(log.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
