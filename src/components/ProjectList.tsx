import React, { useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Building,
  ArrowRight,
  Sparkles,
  Timer,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Clock3,
  TrendingUp,
  ChevronDown,
  Lock,
  ShieldCheck,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { useBimData } from '../context/BimDataContext';
import { BimProject, ProjectStatus, PROJECT_STATUS_OPTIONS } from '../types';
import { calculateDeliveryVariance, getProjectStatusStyle } from '../utils/deliveryVariance';

interface ProjectListProps {
  onSelectProject: (project: BimProject) => void;
  onOpenNewProjectModal: () => void;
  onOpenReportModalWithProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  onSelectProject,
  onOpenNewProjectModal,
  onOpenReportModalWithProject,
}) => {
  const { projects, getProjectCompletedHours, employees, updateProjectStatus, updateProject } = useBimData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [isSuperAdmin, setIsSuperAdmin] = useState(true); // Super Admin role switcher
  const [editingActualDateProject, setEditingActualDateProject] = useState<BimProject | null>(null);
  const [newActualDateValue, setNewActualDateValue] = useState('');

  const filterOptions = [
    { id: 'all', label: 'All Projects' },
    { id: 'WIP', label: 'WIP' },
    { id: 'On Track', label: 'On Track' },
    { id: 'At Risk', label: 'At Risk' },
    { id: 'HOLD', label: 'HOLD' },
    { id: 'CLOSED', label: 'CLOSED' },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.status.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;
    const matchesDiscipline =
      disciplineFilter === 'all' ||
      (p.disciplines || []).some(
        (d) =>
          d === disciplineFilter ||
          (disciplineFilter === 'BIM - ACS' && (d === 'BIM - ACS' || d === 'Architecture' as any))
      );
    return matchesSearch && matchesStatus && matchesDiscipline;
  });

  // Calculate total portfolio stats
  const totalLoggedHours = projects.reduce((sum, p) => sum + getProjectCompletedHours(p.id), 0);
  const totalEstimatedHours = projects.reduce((sum, p) => sum + p.totalEstimatedHours, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Projects & Hours
            </h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Multi-Project Portfolio
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking {projects.length} organizational BIM projects • {totalLoggedHours.toFixed(1)}h Total Logged / {totalEstimatedHours.toFixed(1)}h Estimated
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Super Admin Status Badge & Switcher */}
          <button
            onClick={() => setIsSuperAdmin(!isSuperAdmin)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isSuperAdmin
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Click to toggle Super Admin elevation for testing Actual Delivered Date lock"
          >
            {isSuperAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin: Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Super Admin: Locked</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New BIM Project</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          {/* Search Input */}
          <div className="flex items-center gap-2 w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, client, typology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
            />
          </div>

          {/* BIM Disciplines Filter Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-400 font-semibold whitespace-nowrap">BIM Discipline:</span>
            <select
              aria-label="Filter projects by BIM Discipline"
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-slate-900">All Disciplines</option>
              <option value="BIM - ACS" className="bg-slate-900">BIM - ACS</option>
              <option value="Structure" className="bg-slate-900">Structure</option>
              <option value="MEP - HVAC" className="bg-slate-900">MEP - HVAC</option>
              <option value="MEP - Electrical" className="bg-slate-900">MEP - Electrical</option>
              <option value="MEP - Plumbing" className="bg-slate-900">MEP - Plumbing</option>
              <option value="Fire Protection" className="bg-slate-900">Fire Protection</option>
              <option value="Façade / Envelope" className="bg-slate-900">Façade / Envelope</option>
              <option value="Coordination & QA" className="bg-slate-900">Coordination & QA</option>
            </select>
          </div>
        </div>

        {/* Status Filter buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            {filterOptions.map((opt) => {
              const count = opt.id === 'all'
                ? projects.length
                : projects.filter((p) => p.status === opt.id).length;
              return (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-2.5 py-1 rounded font-medium transition whitespace-nowrap text-xs ${
                    statusFilter === opt.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 text-[11px]">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Project Name</th>
                  <th className="py-3 px-3 min-w-[140px]">Status (Manual Change)</th>
                  <th className="py-3 px-3 min-w-[130px]">Total Hours Logged</th>
                  <th className="py-3 px-3 min-w-[120px]">Estimated Hours</th>
                  <th className="py-3 px-3 min-w-[130px]">Planned Delivery Date</th>
                  <th className="py-3 px-3 min-w-[150px]">
                    <div className="flex items-center gap-1.5">
                      <span>Actual Delivered Date</span>
                      <span className="p-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30" title="Locked - Super Admin Edit Only">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 min-w-[120px]">Difference</th>
                  <th className="py-3 px-3 min-w-[110px]">Hours Burn</th>
                  <th className="py-3 px-3 text-right min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No projects found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const completed = getProjectCompletedHours(project.id);
                    const pct = project.totalEstimatedHours > 0
                      ? Math.round((completed / project.totalEstimatedHours) * 100)
                      : completed > 0 ? 100 : 0;
                    const isOver = completed > project.totalEstimatedHours && project.totalEstimatedHours > 0;
                    const isZeroEstOver = project.totalEstimatedHours === 0 && completed > 0;
                    const plannedDate = project.plannedDeliveryDate || project.targetCompletionDate;
                    const actualDate = project.actualDeliveredDate;
                    const varianceInfo = calculateDeliveryVariance(plannedDate, actualDate, project.status);

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-slate-800/50 transition cursor-pointer group"
                        onClick={() => onSelectProject(project)}
                      >
                        {/* Project Name (Only project name, no description below) */}
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-white group-hover:text-blue-300 transition text-[13px] whitespace-nowrap">
                            {project.name}
                          </div>
                        </td>

                        {/* Status with Manual Select Dropdown */}
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <select
                              value={project.status}
                              onChange={(e) => {
                                updateProjectStatus(project.id, e.target.value as ProjectStatus);
                              }}
                              className={`appearance-none font-semibold text-[11px] px-2.5 py-1 pr-6 rounded-md border cursor-pointer focus:outline-none transition shadow-xs ${getProjectStatusStyle(
                                project.status
                              )}`}
                            >
                              <option value="WIP" className="bg-slate-900 text-cyan-300">WIP</option>
                              <option value="On Track" className="bg-slate-900 text-emerald-300">On Track</option>
                              <option value="At Risk" className="bg-slate-900 text-amber-300">At Risk</option>
                              <option value="HOLD" className="bg-slate-900 text-orange-300">HOLD</option>
                              <option value="CLOSED" className="bg-slate-900 text-slate-300">CLOSED</option>
                              <option value="Completed" className="bg-slate-900 text-emerald-300">Completed</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        {/* Total Hours Logged */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="font-bold text-slate-100 text-[12px] font-mono">
                              {completed.toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-[10px]">hrs</span>
                          </div>
                        </td>

                        {/* Estimated Hours */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-300 text-[12px] font-mono">
                              {project.totalEstimatedHours.toFixed(1)}
                            </span>
                            <span className="text-slate-500 text-[10px]">hrs</span>
                          </div>
                        </td>

                        {/* Planned Delivery Date */}
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{plannedDate || '—'}</span>
                          </div>
                        </td>

                        {/* Actual Delivered Date (Locked - Super Admin Only) */}
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          {isSuperAdmin ? (
                            <div className="flex items-center gap-1.5">
                              {actualDate ? (
                                <div className="flex items-center gap-1 font-medium text-emerald-300">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{actualDate}</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono text-xs">—</span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingActualDateProject(project);
                                  setNewActualDateValue(actualDate || '');
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition"
                                title="Edit Actual Delivered Date (Super Admin Privilege)"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-medium text-slate-400" title="Locked - Super Admin Only">
                              <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className={actualDate ? 'text-slate-300' : 'text-slate-500'}>
                                {actualDate || 'Locked'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Difference / Variance */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${varianceInfo.badgeClass}`}
                          >
                            {varianceInfo.label}
                          </span>
                        </td>

                        {/* Hours Burn % & Progress */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isOver || isZeroEstOver ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold ${isOver || isZeroEstOver ? 'text-amber-400' : 'text-slate-300'}`}>
                              {pct}%
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenReportModalWithProject(project.id)}
                              className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 rounded transition"
                              title="Generate Stakeholder Report"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectProject(project)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white transition font-medium text-[11px]"
                            >
                              View
                            </button>
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
      {/* Super Admin Modal: Edit Actual Delivered Date */}
      {editingActualDateProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Super Admin Date Override</h3>
                  <p className="text-[11px] text-slate-400">Lock protected field</p>
                </div>
              </div>
              <button
                onClick={() => setEditingActualDateProject(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Target Project:</span>
                <strong className="text-white font-semibold text-xs">{editingActualDateProject.name}</strong>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Planned Delivery Date:</span>
                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 font-mono text-slate-300">
                  {editingActualDateProject.plannedDeliveryDate || editingActualDateProject.targetCompletionDate || 'Not set'}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block text-[11px] mb-1">
                  Actual Delivered Date (DD-MM-YYYY or YYYY-MM-DD) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18-08-2026 or 2026-08-18"
                  value={newActualDateValue}
                  onChange={(e) => setNewActualDateValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave empty to mark as WIP/In-Progress without delivery timestamp.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setEditingActualDateProject(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateProject(editingActualDateProject.id, {
                    actualDeliveredDate: newActualDateValue.trim() || undefined
                  });
                  setEditingActualDateProject(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Date</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
