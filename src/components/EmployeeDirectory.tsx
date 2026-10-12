import React, { useState } from 'react';
import {
  Users,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  Edit,
  UserCheck
} from 'lucide-react';
import { useBimData } from '../context/BimDataContext';
import { Employee, Discipline, PRIMARY_DISCIPLINES } from '../types';
import { EditEmployeeModal } from './EditEmployeeModal';

interface EmployeeDirectoryProps {
  onOpenNewEmployeeModal: () => void;
  onOpenLogModalForEmployee?: (empId: string) => void;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  onOpenNewEmployeeModal,
}) => {
  const { employees, workLogs, projects, getEmployeeLoggedHours, theme } = useBimData();
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filteredEmployees = (employees || []).filter((emp) => {
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.skills || []).some((s) => (s || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiscipline =
      disciplineFilter === 'all' || emp.primaryDiscipline === disciplineFilter;
    return matchesSearch && matchesDiscipline;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-xl p-5 shadow-xs transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Team Efficiency
            </h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Specialists & Capacity
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Managing {employees.length} engaged team members, designated roles, disciplines, workload capacity, and productivity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewEmployeeModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border p-3.5 rounded-xl transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-2 w-full sm:w-80 relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search member name, role title, mail ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs rounded-lg pl-9 pr-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight
                ? 'bg-slate-50 text-slate-900 border-slate-300 placeholder-slate-400'
                : 'bg-slate-800 text-slate-200 border-slate-700 placeholder-slate-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            aria-label="Filter specialists by discipline"
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className={`text-xs rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
              isLight
                ? 'bg-slate-50 text-slate-900 border-slate-300'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <option value="all">All Primary Disciplines</option>
            {PRIMARY_DISCIPLINES.map((discipline) => (
              <option key={discipline} value={discipline}>
                {discipline}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map((emp) => {
          const loggedThisWeek = getEmployeeLoggedHours(emp.id, 'this-week');
          const totalAllTime = workLogs
            .filter((w) => w.employeeId === emp.id)
            .reduce((sum, w) => sum + w.hoursLogged, 0);

          const capacityPct = Math.round((loggedThisWeek / (emp.weeklyCapacityHours || 40)) * 100);
          const isOverloaded = loggedThisWeek > (emp.weeklyCapacityHours || 40);

          // Projects assigned
          const assignedProjects = projects.filter((p) =>
            emp.activeProjectIds?.includes(p.id)
          );

          return (
            <div
              key={emp.id}
              className={`border rounded-xl p-5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition shadow-sm ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-900 border-slate-800 text-slate-100'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-bold text-base truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {emp.name}
                      </h3>
                      <p className="text-xs text-blue-500 dark:text-blue-400 font-medium truncate mt-0.5">
                        {emp.role}
                      </p>
                      <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {emp.primaryDiscipline}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingEmployee(emp)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition shrink-0 ${
                        isLight
                          ? 'bg-slate-50 hover:bg-slate-100 text-blue-600 border-slate-200'
                          : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700'
                      }`}
                      title="Edit member details"
                    >
                      <Edit className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">Edit</span>
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className={`p-2.5 rounded-lg text-xs space-y-1 mb-3 ${
                  isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-800/60 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.phone}</span>
                    </div>
                  )}
                </div>

                {/* Capacity & Weekly Logged Meter */}
                <div className={`border rounded-lg p-3 text-xs mb-3 space-y-1.5 ${
                  isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/60 border-slate-700/60'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Weekly Capacity Load:</span>
                    <span className={`font-bold ${isOverloaded ? 'text-amber-500' : isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {loggedThisWeek.toFixed(1)} / {emp.weeklyCapacityHours || 40}h ({capacityPct}%)
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverloaded ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, capacityPct)}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Projects */}
                <div className="space-y-1.5 text-xs mb-3">
                  <span className={`font-medium text-[11px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Assigned Projects ({assignedProjects.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedProjects.length > 0 ? (
                      assignedProjects.map((p) => (
                        <span
                          key={p.id}
                          className={`px-2 py-0.5 rounded text-[11px] border truncate max-w-[200px] ${
                            isLight
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-slate-800 text-slate-300 border-slate-700/60'
                          }`}
                          title={p.name}
                        >
                          {p.code}
                        </span>
                      ))
                    ) : (
                      <span className={`text-[11px] italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        No active project assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* BIM Software & Competencies */}
                <div className="space-y-1 text-xs mb-3">
                  <span className={`font-medium text-[11px] block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    BIM Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {emp.skills.map((skill, i) => (
                      <span
                        key={i}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isLight
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-800/80 text-slate-400'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer metrics */}
              <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
              }`}>
                <div>
                  <span className="block text-[10px]">Total Logged:</span>
                  <strong className={`text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {totalAllTime.toFixed(1)} hrs
                  </strong>
                </div>
                <div className="text-right">
                  <span className="block text-[10px]">Status:</span>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      emp.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : emp.status === 'High Workload'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {emp.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
      />
    </div>
  );
};
