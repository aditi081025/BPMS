import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Building,
  User,
  Calendar,
  CheckCircle2,
  Tag,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBimData } from '../context/BimDataContext';
import { Discipline, ActivityType, LODLevel } from '../types';

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjectId?: string;
}

export const LogTimeModal: React.FC<LogTimeModalProps> = ({
  isOpen,
  onClose,
  preselectedProjectId,
}) => {
  const { projects, employees, addWorkLog } = useBimData();

  const [projectId, setProjectId] = useState<string>(
    preselectedProjectId || projects[0]?.id || ''
  );
  const [employeeId, setEmployeeId] = useState<string>(employees[0]?.id || '');
  const [date, setDate] = useState<string>('2026-08-18');
  const [hours, setHours] = useState<number>(4);
  const [discipline, setDiscipline] = useState<Discipline>('MEP - HVAC');
  const [activityType, setActivityType] = useState<ActivityType>(
    '3D Detailed Modeling'
  );
  const [taskName, setTaskName] = useState<string>('');
  const [lodStage, setLodStage] = useState<LODLevel>('LOD 350');
  const [notes, setNotes] = useState<string>('');
  const [billable, setBillable] = useState<boolean>(true);

  // Sync selected project
  useEffect(() => {
    if (preselectedProjectId) {
      setProjectId(preselectedProjectId);
    }
  }, [preselectedProjectId]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedEmployee = employees.find((e) => e.id === employeeId);

  // Auto-fill task if project has tasks
  useEffect(() => {
    if (selectedProject?.tasks && selectedProject.tasks.length > 0 && selectedProject.tasks[0]) {
      setTaskName(selectedProject.tasks[0].name || '');
      setDiscipline(selectedProject.tasks[0].discipline || 'MEP - HVAC');
      setLodStage(selectedProject.tasks[0].lod || 'LOD 350');
    }
  }, [projectId, selectedProject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !employeeId || hours <= 0) return;

    addWorkLog({
      employeeId,
      employeeName: selectedEmployee?.name || 'BIM Modeler',
      projectId,
      projectName: selectedProject?.name || 'BIM Project',
      date,
      hoursLogged: Number(hours),
      discipline,
      activityType,
      taskName: taskName || `${discipline} Modeling Task`,
      lodStage,
      notes: notes || `Logged ${hours}h on ${activityType} for ${selectedProject?.name}`,
      billable,
    });

    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 },
      });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full my-8 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Log Daily Project Hours
              </h3>
              <p className="text-xs text-slate-400">
                Record BIM modeler time against project WBS and LOD stages
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                BIM Specialist / Modeler
              </label>
              <select
                aria-label="Select Modeler"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                required
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Target Project
              </label>
              <select
                aria-label="Select Target Project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Log Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Hours Spent
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                LOD Level
              </label>
              <select
                aria-label="Select LOD Level"
                value={lodStage}
                onChange={(e) => setLodStage(e.target.value as LODLevel)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="LOD 100">LOD 100</option>
                <option value="LOD 200">LOD 200</option>
                <option value="LOD 300">LOD 300</option>
                <option value="LOD 350">LOD 350</option>
                <option value="LOD 400">LOD 400</option>
                <option value="LOD 500">LOD 500</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                BIM Discipline
              </label>
              <select
                aria-label="Select BIM Discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as Discipline)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="BIM - ACS">BIM - ACS</option>
                <option value="Structure">Structure</option>
                <option value="MEP - HVAC">MEP - HVAC</option>
                <option value="MEP - Electrical">MEP - Electrical</option>
                <option value="MEP - Plumbing">MEP - Plumbing</option>
                <option value="Façade / Envelope">Façade / Envelope</option>
                <option value="Coordination & QA">Coordination & QA</option>
                <option value="Fire Protection">Fire Protection</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Activity Category
              </label>
              <select
                aria-label="Select Activity Category"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as ActivityType)}
                className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Drawing">Drawing</option>
                <option value="Input Document study">Input Document study</option>
                <option value="Estimation">Estimation</option>
                <option value="QA & QC">QA & QC</option>
                <option value="RFI , Mark up & issue Creation">RFI , Mark up & issue Creation</option>
                <option value="Dynamo Script Making">Dynamo Script Making</option>
                <option value="Addins & Pluggins Creation">Addins & Pluggins Creation</option>
                <option value="3D Detailed Modeling">3D Detailed Modeling</option>
                <option value="Clash Detection & Resolution">Clash Detection & Resolution</option>
                <option value="Construction Documentation & Sheets">Construction Documentation & Sheets</option>
                <option value="Parametric Family Creation">Parametric Family Creation</option>
                <option value="Coordination & Navisworks Review">Coordination & Navisworks Review</option>
                <option value="COBie & Asset Data Entry">COBie & Asset Data Entry</option>
                <option value="Scan-to-BIM Point Cloud Modeling">Scan-to-BIM Point Cloud Modeling</option>
                <option value="2D to 3D Conversion">2D to 3D Conversion</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Task Details
            </label>
            <input
              type="text"
              placeholder="e.g. Operating Room Ceiling Boom & Duct Clearance Detailing"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Work Notes & Technical Details
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of coordination adjustments, clashes resolved, or sheets compiled..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 rounded-lg p-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="billable" className="text-slate-300 select-none cursor-pointer">
              Billable Client Project Hours
            </label>
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Timesheet Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
