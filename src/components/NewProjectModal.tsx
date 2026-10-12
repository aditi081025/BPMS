import React, { useState } from 'react';
import {
  X,
  Layers,
  Building,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  Users,
  Timer,
  AlertTriangle,
  PauseCircle,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBimData } from '../context/BimDataContext';
import { Discipline, LODLevel, ProjectStatus, PROJECT_STATUS_OPTIONS } from '../types';
import { calculateDeliveryVariance } from '../utils/deliveryVariance';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addProject, employees } = useBimData();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [buildingType, setBuildingType] = useState('Commercial High-Rise');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('WIP');
  const [totalEstimatedHours, setTotalEstimatedHours] = useState(1200);
  const [budgetAmount, setBudgetAmount] = useState(180000);
  const [currentLOD, setCurrentLOD] = useState<LODLevel>('LOD 300');
  const [targetLOD, setTargetLOD] = useState<LODLevel>('LOD 350');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState('2026-11-30');
  const [actualDeliveredDate, setActualDeliveredDate] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Discipline[]>([
    'BIM - ACS',
    'Structure',
    'MEP - HVAC',
    'MEP - Electrical',
  ]);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([
    employees[0]?.id || '',
    employees[1]?.id || '',
  ]);

  if (!isOpen) return null;

  const liveVariance = calculateDeliveryVariance(plannedDeliveryDate, actualDeliveredDate || undefined, status);

  const handleToggleDiscipline = (disc: Discipline) => {
    if (selectedDisciplines.includes(disc)) {
      setSelectedDisciplines(selectedDisciplines.filter((d) => d !== disc));
    } else {
      setSelectedDisciplines([...selectedDisciplines, disc]);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    if (assignedEmployeeIds.includes(empId)) {
      setAssignedEmployeeIds(assignedEmployeeIds.filter((id) => id !== empId));
    } else {
      setAssignedEmployeeIds([...assignedEmployeeIds, empId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !clientName) return;

    addProject({
      name,
      code,
      clientName,
      buildingType,
      location: location || 'Global',
      description: description || `${buildingType} BIM modeling and multi-trade coordination project.`,
      status,
      currentLOD,
      targetLOD,
      totalEstimatedHours: Number(totalEstimatedHours),
      totalCompletedHours: 0,
      budgetAmount: Number(budgetAmount),
      startDate,
      targetCompletionDate: plannedDeliveryDate,
      plannedDeliveryDate,
      actualDeliveredDate: actualDeliveredDate.trim() ? actualDeliveredDate : undefined,
      disciplines: selectedDisciplines,
      assignedEmployeeIds,
      tasks: [
        {
          id: `task-${Date.now()}-1`,
          name: `${currentLOD} Core Modeling Setup`,
          discipline: selectedDisciplines[0] || 'BIM - ACS',
          lod: currentLOD,
          estimatedHours: Math.round(Number(totalEstimatedHours) * 0.4),
          completedHours: 0,
          status: 'In Progress',
          assignedEmployeeId: assignedEmployeeIds[0] || '',
          dueDate: plannedDeliveryDate,
        },
      ],
      milestones: [
        {
          id: `ms-${Date.now()}-1`,
          title: `Initial ${currentLOD} Model Release`,
          targetDate: startDate,
          status: 'in-progress',
          lodRequirement: currentLOD,
          deliverableDescription: `Delivery of coordinated ${selectedDisciplines.join(', ')} geometry to client.`,
        },
      ],
      clashes: [],
    });

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-8 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New BIM Project</h3>
              <p className="text-xs text-slate-400">
                Configure delivery schedule, variance tracking, hour budgets, and BIM milestones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Project Name, Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. London Wall Gym"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Project Code</label>
              <input
                type="text"
                placeholder="e.g. BIM-LWG"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                {PROJECT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client, Typology, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Client / Owner</label>
              <input
                type="text"
                placeholder="e.g. City Wellness Properties UK"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Building Typology</label>
              <input
                type="text"
                placeholder="e.g. Sports & Wellness Facility"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. London, UK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Delivery Dates & Live Difference Highlight */}
          <div className="p-3.5 bg-slate-850 bg-slate-800/60 border border-slate-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Delivery Milestones & Variance Highlight
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${liveVariance.badgeClass}`}>
                Difference: {liveVariance.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Delivery Date (Planned) <span className="text-blue-400">*</span>
                </label>
                <input
                  type="date"
                  value={plannedDeliveryDate}
                  onChange={(e) => setPlannedDeliveryDate(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Actual Delivered Date <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={actualDeliveredDate}
                  onChange={(e) => setActualDeliveredDate(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>
          </div>

          {/* Hours, Budget, LOD */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Estimated Hours</label>
              <input
                type="number"
                value={totalEstimatedHours}
                onChange={(e) => setTotalEstimatedHours(Number(e.target.value))}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Budget ($ USD)</label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(Number(e.target.value))}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Current LOD</label>
              <select
                value={currentLOD}
                onChange={(e) => setCurrentLOD(e.target.value as LODLevel)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOD 100">LOD 100</option>
                <option value="LOD 200">LOD 200</option>
                <option value="LOD 300">LOD 300</option>
                <option value="LOD 350">LOD 350</option>
                <option value="LOD 400">LOD 400</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target LOD</label>
              <select
                value={targetLOD}
                onChange={(e) => setTargetLOD(e.target.value as LODLevel)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOD 300">LOD 300</option>
                <option value="LOD 350">LOD 350</option>
                <option value="LOD 400">LOD 400</option>
                <option value="LOD 500">LOD 500</option>
              </select>
            </div>
          </div>

          {/* Disciplines */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">BIM Disciplines</label>
            <div className="flex flex-wrap gap-2">
              {[
                'BIM - ACS',
                'Structure',
                'MEP - HVAC',
                'MEP - Electrical',
                'MEP - Plumbing',
                'Façade / Envelope',
                'Coordination & QA',
                'Fire Protection',
              ].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleToggleDiscipline(d as Discipline)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                    selectedDisciplines.includes(d as Discipline)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Assign BIM Specialists</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
              {employees.map((emp) => (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => handleToggleEmployee(emp.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
                    assignedEmployeeIds.includes(emp.id)
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                    {emp.name.charAt(0) || 'U'}
                  </div>
                  <span>{emp.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
