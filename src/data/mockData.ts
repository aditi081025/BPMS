import { Employee, BimProject, DailyWorkLog } from '../types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-2',
    name: 'Sushovan Das',
    role: 'BIM Coordinator',
    primaryDiscipline: 'Coordination & QA',
    discipline: 'Coordination & QA',
    email: 'sushovan.das@bimworkspace.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    experienceYears: 10,
    weeklyCapacityHours: 40.0,
    activeProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-6', 'proj-11'],
    skills: ['Clash Detection', 'Navisworks', 'Revit MEP', 'Solibri QA', 'Coordination & QA'],
    status: 'Active',
    phone: '+1 (555) 345-6789'
  },
  {
    id: 'emp-aditi',
    name: 'Aditi',
    role: 'BIM Modeler',
    primaryDiscipline: 'BIM - ACS',
    discipline: 'BIM - ACS',
    email: 'aditi@bimworkspace.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    experienceYears: 6,
    weeklyCapacityHours: 40.0,
    activeProjectIds: ['proj-1', 'proj-2', 'proj-3', 'proj-5', 'proj-8', 'proj-10'],
    skills: ['Revit Architecture', 'Navisworks Manage', 'COBie', 'Dynamo Automation'],
    status: 'Active',
    phone: '+1 (555) 456-7890'
  }
];

export const INITIAL_PROJECTS: BimProject[] = [
  {
    id: 'proj-1',
    code: 'BIM-LWG',
    name: 'London Wall Gym',
    clientName: 'City Wellness Properties UK',
    buildingType: 'Sports & Wellness Facility',
    location: 'London, UK',
    grossFloorAreaSqm: 14200,
    startDate: '2026-03-01',
    targetCompletionDate: '2026-08-11',
    plannedDeliveryDate: '2026-08-11',
    actualDeliveredDate: undefined,
    status: 'WIP',
    totalEstimatedHours: 24.0,
    totalCompletedHours: 30.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 115000,
    description: 'Bespoke fitness mezzanine, high-velocity acoustic HVAC routing, and structural exposed truss coordination.',
    disciplines: ['BIM - ACS', 'Structure', 'MEP - HVAC', 'MEP - Electrical', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-101',
        title: 'Architectural & Acoustic Shell Sign-Off',
        targetDate: '2026-05-30',
        completionDate: '2026-05-25',
        status: 'completed',
        deliverableDescription: 'Approved core walls, sound-isolated workout studios, and structural mezzanines.',
        lodRequirement: 'LOD 300'
      },
      {
        id: 'ms-102',
        title: 'Exposed Ductwork & Lighting Clearance Freeze',
        targetDate: '2026-08-30',
        status: 'in-progress',
        deliverableDescription: 'Zero critical hard clashes between open-ceiling ductwork and lighting tracks.',
        lodRequirement: 'LOD 350'
      },
      {
        id: 'ms-103',
        title: 'Final Construction LOD 350 Spool Submittal',
        targetDate: '2026-10-15',
        status: 'upcoming',
        deliverableDescription: 'Validated shop drawings and penetrations handover.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-101',
        projectId: 'proj-1',
        name: 'Gym Main Hall Exposed Spiral Ducting & Diffusers',
        discipline: 'MEP - HVAC',
        lod: 'LOD 350',
        estimatedHours: 10,
        completedHours: 14,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-10'
      },
      {
        id: 'tsk-102',
        projectId: 'proj-1',
        name: 'Acoustic Wall Paneling & Mezzanine Framing',
        discipline: 'BIM - ACS',
        lod: 'LOD 300',
        estimatedHours: 8,
        completedHours: 10,
        status: 'In Progress',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-09-18'
      },
      {
        id: 'tsk-103',
        projectId: 'proj-1',
        name: 'Multi-Discipline Clash Verification Audit',
        discipline: 'Coordination & QA',
        lod: 'LOD 350',
        estimatedHours: 6,
        completedHours: 6,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-25'
      }
    ],
    clashes: [
      {
        id: 'clash-101',
        disciplineA: 'MEP - HVAC',
        disciplineB: 'Structure',
        severity: 'Major',
        status: 'Reviewed',
        elementRef: 'Exposed 600mm Spiral Duct vs Steel Web Stiffener Grid B3',
        locationDescription: 'Main Cardio Deck Overhead',
        assignedToEmployeeId: 'emp-2',
        identifiedDate: '2026-08-05'
      }
    ]
  },
  {
    id: 'proj-2',
    code: 'BIM-WPG',
    name: 'Watermark Podium Garage',
    clientName: 'Watermark Developments Group',
    buildingType: 'Podium Parking & Multi-Level Facility',
    location: 'Chicago, IL',
    grossFloorAreaSqm: 42000,
    startDate: '2026-02-15',
    targetCompletionDate: '2026-08-17',
    plannedDeliveryDate: '2026-08-17',
    actualDeliveredDate: undefined,
    status: 'On Track',
    totalEstimatedHours: 40.0,
    totalCompletedHours: 18.0,
    currentLOD: 'LOD 350',
    targetLOD: 'LOD 400',
    budgetAmount: 168000,
    description: 'Underground sump pumps, EV charging distribution networks, drainage sloped headers, and ventilation jet fans.',
    disciplines: ['MEP - HVAC', 'MEP - Electrical', 'MEP - Plumbing', 'Fire Protection', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-201',
        title: 'Basement Drainage & Sump Pump Routing',
        targetDate: '2026-06-15',
        completionDate: '2026-06-10',
        status: 'completed',
        deliverableDescription: 'LOD 350 gravity sanitary slopes coordinated with post-tensioned slab beams.',
        lodRequirement: 'LOD 350'
      },
      {
        id: 'ms-202',
        title: 'EV Charging Trunk Lines & Transformer Room Signoff',
        targetDate: '2026-09-30',
        status: 'in-progress',
        deliverableDescription: 'Multi-tiered cable ladder layout across 6 parking decks.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-201',
        projectId: 'proj-2',
        name: 'Parking Deck 1-4 Sloped Drainage & Storm Headers',
        discipline: 'MEP - Plumbing',
        lod: 'LOD 350',
        estimatedHours: 20,
        completedHours: 10,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-15'
      },
      {
        id: 'tsk-202',
        projectId: 'proj-2',
        name: 'Jet Fan Ventilation System & Carbon Monoxide Exhaust',
        discipline: 'MEP - HVAC',
        lod: 'LOD 350',
        estimatedHours: 20,
        completedHours: 8,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-22'
      }
    ],
    clashes: [
      {
        id: 'clash-201',
        disciplineA: 'MEP - Plumbing',
        disciplineB: 'MEP - Electrical',
        severity: 'Minor',
        status: 'Resolved',
        elementRef: '6" Storm Leader vs 400A EV Subpanel Feeder',
        locationDescription: 'Deck 2 Ramp Access',
        assignedToEmployeeId: 'emp-2',
        identifiedDate: '2026-07-20',
        resolvedDate: '2026-07-26'
      }
    ]
  },
  {
    id: 'proj-3',
    code: 'BIM-NBIA',
    name: 'New Bugesera International Airport',
    clientName: 'Bugesera Airport Authority & AviAlliance',
    buildingType: 'International Aviation Terminal & Concourse',
    location: 'Bugesera, Rwanda',
    grossFloorAreaSqm: 110000,
    startDate: '2026-01-01',
    targetCompletionDate: '2026-08-05',
    plannedDeliveryDate: '2026-08-05',
    actualDeliveredDate: undefined,
    status: 'On Track',
    totalEstimatedHours: 350.0,
    totalCompletedHours: 268.0,
    currentLOD: 'LOD 350',
    targetLOD: 'LOD 400',
    budgetAmount: 460000,
    description: 'Curved long-span terminal roof, passenger boarding bridges, baggage handling conveyors, and large-scale central utility plant.',
    disciplines: ['BIM - ACS', 'Structure', 'MEP - HVAC', 'MEP - Electrical', 'Façade / Envelope', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-301',
        title: 'Terminal Main Concourse Structural Steel Frame Freeze',
        targetDate: '2026-06-30',
        completionDate: '2026-06-25',
        status: 'completed',
        deliverableDescription: 'Long-span steel trusses and glass curtain wall anchoring.',
        lodRequirement: 'LOD 350'
      },
      {
        id: 'ms-302',
        title: 'Baggage Handling & Underfloor MEP Coordination',
        targetDate: '2026-11-30',
        status: 'in-progress',
        deliverableDescription: 'Baggage conveyor clearance zones and underground utility chases.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-301',
        projectId: 'proj-3',
        name: 'Terminal Wing Curved Roof Trusses & Skylight Embeds',
        discipline: 'Structure',
        lod: 'LOD 350',
        estimatedHours: 200,
        completedHours: 160,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-10-15'
      },
      {
        id: 'tsk-302',
        projectId: 'proj-3',
        name: 'Passenger Gates 1-16 Navisworks Coordination Audit',
        discipline: 'Coordination & QA',
        lod: 'LOD 350',
        estimatedHours: 150,
        completedHours: 108,
        status: 'In Progress',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-10-30'
      }
    ],
    clashes: [
      {
        id: 'clash-301',
        disciplineA: 'MEP - HVAC',
        disciplineB: 'Structure',
        severity: 'Critical',
        status: 'Active',
        elementRef: 'Main Departure Hall 1400mm Supply Air Duct vs Diagonal Roof Brace TB-12',
        locationDescription: 'Departure Level Grid J-14',
        assignedToEmployeeId: 'emp-2',
        identifiedDate: '2026-08-12'
      }
    ]
  },
  {
    id: 'proj-4',
    code: 'BIM-EWP',
    name: 'Evanston Water Plant',
    clientName: 'Evanston Municipal Utilities',
    buildingType: 'Municipal Water Treatment & Pumping Station',
    location: 'Evanston, IL',
    grossFloorAreaSqm: 26000,
    startDate: '2026-02-01',
    targetCompletionDate: '2026-08-21',
    plannedDeliveryDate: '2026-08-21',
    actualDeliveredDate: undefined,
    status: 'On Track',
    totalEstimatedHours: 180.0,
    totalCompletedHours: 99.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 138000,
    description: 'High-pressure chemical feed lines, ozone contactor piping, heavy pump manifolds, and electrical MCC rooms.',
    disciplines: ['MEP - HVAC', 'MEP - Electrical', 'MEP - Plumbing', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-401',
        title: 'Chemical Feed & High-Pressure Pump Room LOD 300',
        targetDate: '2026-06-30',
        completionDate: '2026-06-28',
        status: 'completed',
        deliverableDescription: 'Pump skids, chemical dosing manifolds, and containment sumps.',
        lodRequirement: 'LOD 300'
      },
      {
        id: 'ms-402',
        title: 'Electrical MCC & SCADA Cable Tray Routing',
        targetDate: '2026-09-30',
        status: 'in-progress',
        deliverableDescription: 'High-voltage switchgear feeder trays and PLC control panels.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-401',
        projectId: 'proj-4',
        name: 'Pump Station Manifold Spool Detailing',
        discipline: 'MEP - Plumbing',
        lod: 'LOD 350',
        estimatedHours: 180,
        completedHours: 99,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-30'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-5',
    code: 'BIM-82ND',
    name: '6-8 E 82nd',
    clientName: 'Manhattan Heritage Partners',
    buildingType: 'Point Cloud Scan to BIM Historic Restoration',
    location: 'New York, NY',
    grossFloorAreaSqm: 18500,
    startDate: '2026-03-15',
    targetCompletionDate: '2026-08-24',
    plannedDeliveryDate: '2026-08-24',
    actualDeliveredDate: undefined,
    status: 'WIP',
    totalEstimatedHours: 120.0,
    totalCompletedHours: 32.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 94000,
    description: 'Terrestrial LiDAR point cloud registration, historical decorative limestone facade modeling, and timber floor deflection analysis.',
    disciplines: ['BIM - ACS', 'Structure', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-aditi', 'emp-2'],
    milestones: [
      {
        id: 'ms-501',
        title: 'LiDAR Point Cloud Mesh Registration & Alignment',
        targetDate: '2026-05-15',
        completionDate: '2026-05-12',
        status: 'completed',
        deliverableDescription: 'Clean point clouds tied to surveyed survey control benchmarks.',
        lodRequirement: 'LOD 300'
      },
      {
        id: 'ms-502',
        title: 'Historical Carved Cornices & Masonry As-Built Delivery',
        targetDate: '2026-08-30',
        status: 'in-progress',
        deliverableDescription: 'LOD 350 families for all heritage facade stone ornaments.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-501',
        projectId: 'proj-5',
        name: 'Limestone Facade & Carved Cornice Parametric Modeling',
        discipline: 'BIM - ACS',
        lod: 'LOD 350',
        estimatedHours: 120,
        completedHours: 32,
        status: 'In Progress',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-08-30'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-6',
    code: 'BIM-90F',
    name: '90 Furman',
    clientName: 'Brooklyn Bridge Waterfront Holdings',
    buildingType: 'Luxury Waterfront Residential & Hotel',
    location: 'Brooklyn, NY',
    grossFloorAreaSqm: 52000,
    startDate: '2026-02-01',
    targetCompletionDate: '2026-08-12',
    plannedDeliveryDate: '2026-08-12',
    actualDeliveredDate: undefined,
    status: 'On Track',
    totalEstimatedHours: 4.0,
    totalCompletedHours: 3.0,
    currentLOD: 'LOD 350',
    targetLOD: 'LOD 400',
    budgetAmount: 185000,
    description: 'Acoustically isolated VRF mechanical heat pump risers, generator busducts, and sprinkler coordination.',
    disciplines: ['MEP - HVAC', 'MEP - Electrical', 'MEP - Plumbing', 'Fire Protection'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-601',
        title: 'Central Plant Chiller & Emergency Generator Riser Release',
        targetDate: '2026-07-31',
        completionDate: '2026-07-28',
        status: 'completed',
        deliverableDescription: 'Full spool drawings for acoustic vibration isolated risers.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-601',
        projectId: 'proj-6',
        name: 'Emergency Generator & ATS Busduct Routing',
        discipline: 'MEP - Electrical',
        lod: 'LOD 350',
        estimatedHours: 4,
        completedHours: 3,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-09-15'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-7',
    code: 'BIM-90F-RES',
    name: '90 Furman Residential',
    clientName: 'Brooklyn Bridge Waterfront Holdings',
    buildingType: 'High-End Residential Envelope & Interiors',
    location: 'Brooklyn, NY',
    grossFloorAreaSqm: 52000,
    startDate: '2026-04-01',
    targetCompletionDate: '2026-08-12',
    plannedDeliveryDate: '2026-08-12',
    actualDeliveredDate: undefined,
    status: 'HOLD',
    totalEstimatedHours: 31.0,
    totalCompletedHours: 0.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 120000,
    description: 'Glazed floor-to-ceiling curtain wall panels, custom acoustic party wall assemblies, and penthouse structural terraces.',
    disciplines: ['BIM - ACS', 'Structure', 'Façade / Envelope'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-701',
        title: 'Penthouse Balcony & Exterior Envelope Sign-Off',
        targetDate: '2026-10-30',
        status: 'delayed',
        deliverableDescription: 'Awaiting client confirmation on glass acoustic STC rating specs.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-701',
        projectId: 'proj-7',
        name: 'Curtain Wall Mullion Anchors & Balcony Thermal Breaks',
        discipline: 'Façade / Envelope',
        lod: 'LOD 350',
        estimatedHours: 31,
        completedHours: 0,
        status: 'Not Started',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-10-30'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-8',
    code: 'BIM-EWP-FAC',
    name: 'Evanston Water Plant Facility',
    clientName: 'Evanston Municipal Utilities',
    buildingType: 'Structural & Architectural Pumping Facility',
    location: 'Evanston, IL',
    grossFloorAreaSqm: 26000,
    startDate: '2026-03-01',
    targetCompletionDate: '2026-08-21',
    plannedDeliveryDate: '2026-08-21',
    actualDeliveredDate: undefined,
    status: 'WIP',
    totalEstimatedHours: 20.0,
    totalCompletedHours: 8.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 95000,
    description: 'Heavy reinforced concrete retaining tanks, gantry crane steel supports, and industrial precast wall envelope.',
    disciplines: ['BIM - ACS', 'Structure', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-801',
        title: 'Filter Basin Concrete Wall Rebar & Slab Penetrations',
        targetDate: '2026-07-15',
        completionDate: '2026-07-10',
        status: 'completed',
        deliverableDescription: 'Watertight cast-in-place pipe sleeve placements.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-801',
        projectId: 'proj-8',
        name: 'Gantry Crane Runway Beams & Stiffener Plates',
        discipline: 'Structure',
        lod: 'LOD 350',
        estimatedHours: 20,
        completedHours: 8,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-10-15'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-9',
    code: 'BIM-WPG-STR',
    name: 'Watermark Podium Structure',
    clientName: 'Watermark Developments Group',
    buildingType: 'Architectural Screens & Post-Tensioned Parking Structure',
    location: 'Chicago, IL',
    grossFloorAreaSqm: 42000,
    startDate: '2026-02-15',
    targetCompletionDate: '2026-08-17',
    plannedDeliveryDate: '2026-08-17',
    actualDeliveredDate: undefined,
    status: 'WIP',
    totalEstimatedHours: 40.0,
    totalCompletedHours: 6.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 110000,
    description: 'Exterior perforated architectural metal facades, vehicular ramp speed ramps, and elevator cores.',
    disciplines: ['BIM - ACS', 'Structure', 'Façade / Envelope'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-901',
        title: 'Exterior Perforated Screening & Parapet Detailing',
        targetDate: '2026-11-10',
        status: 'in-progress',
        deliverableDescription: 'Fabrication shop drawings for ventilated facade screen.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-901',
        projectId: 'proj-9',
        name: 'Perforated Louver Screen Anchor Brackets',
        discipline: 'Façade / Envelope',
        lod: 'LOD 350',
        estimatedHours: 40,
        completedHours: 6,
        status: 'In Progress',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-11-10'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-10',
    code: 'BIM-BUXTON',
    name: 'Buxton',
    clientName: 'Buxton Logistics & Industrial Parks',
    buildingType: 'CAD to BIM Industrial Distribution Center',
    location: 'Derbyshire, UK',
    grossFloorAreaSqm: 38000,
    startDate: '2026-05-01',
    targetCompletionDate: '2026-08-14',
    plannedDeliveryDate: '2026-08-14',
    actualDeliveredDate: undefined,
    status: 'On Track',
    totalEstimatedHours: 12.0,
    totalCompletedHours: 9.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 300',
    budgetAmount: 48000,
    description: 'Conversion of 2D legacy AutoCAD floor plans and sections into multi-trade coordinated Revit models for tenant fitout.',
    disciplines: ['BIM - ACS', 'Structure'],
    assignedEmployeeIds: ['emp-aditi', 'emp-2'],
    milestones: [
      {
        id: 'ms-1001',
        title: 'AutoCAD Clean-up & Revit Architectural Shell Geometry',
        targetDate: '2026-08-25',
        status: 'in-progress',
        deliverableDescription: 'LOD 300 Revit asset with room schedules and spatial tags.',
        lodRequirement: 'LOD 300'
      }
    ],
    tasks: [
      {
        id: 'tsk-1001',
        projectId: 'proj-10',
        name: 'Industrial Shed Revit Geometry & Wall Types Setup',
        discipline: 'BIM - ACS',
        lod: 'LOD 300',
        estimatedHours: 12,
        completedHours: 9,
        status: 'In Progress',
        assignedEmployeeId: 'emp-aditi',
        dueDate: '2026-08-25'
      }
    ],
    clashes: []
  },
  {
    id: 'proj-11',
    code: 'BIM-82ND-TWN',
    name: '6-8 E 82nd Townhouse',
    clientName: 'Manhattan Heritage Partners',
    buildingType: 'Townhouse Mechanical Modernization',
    location: 'New York, NY',
    grossFloorAreaSqm: 18500,
    startDate: '2026-03-15',
    targetCompletionDate: '2026-08-10',
    plannedDeliveryDate: undefined,
    actualDeliveredDate: '2026-08-18',
    status: 'At Risk',
    totalEstimatedHours: 0.0,
    totalCompletedHours: 19.0,
    currentLOD: 'LOD 350',
    targetLOD: 'LOD 350',
    budgetAmount: 78000,
    description: 'Routing compact hydronic radiant floor heating and VRF condensate drains within existing historic floor joist pockets.',
    disciplines: ['MEP - HVAC', 'MEP - Electrical', 'MEP - Plumbing', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2', 'emp-aditi'],
    milestones: [
      {
        id: 'ms-1101',
        title: 'Floor Joist Penetration & Condensate Drain Coordination',
        targetDate: '2026-08-10',
        completionDate: '2026-08-18',
        status: 'completed',
        deliverableDescription: 'LOD 350 coordinated spool routing submitted to landmarks preservation.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-1101',
        projectId: 'proj-11',
        name: 'Plumbing Risers Fit Verification in Tight Chases',
        discipline: 'MEP - Plumbing',
        lod: 'LOD 350',
        estimatedHours: 0,
        completedHours: 19,
        status: 'Completed',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-08-18'
      }
    ],
    clashes: [
      {
        id: 'clash-1101',
        disciplineA: 'MEP - Plumbing',
        disciplineB: 'MEP - Electrical',
        severity: 'Major',
        status: 'Resolved',
        elementRef: 'Radiant manifold line vs low-voltage AV conduit',
        locationDescription: 'Master suite floor pocket',
        assignedToEmployeeId: 'emp-2',
        identifiedDate: '2026-08-08',
        resolvedDate: '2026-08-16'
      }
    ]
  },
  {
    id: 'proj-12',
    code: 'BIM-TPN',
    name: 'TPN Electrical',
    clientName: 'Trans-Pacific National Grid Services',
    buildingType: 'Electrical Substation & Transmission Facility',
    location: 'Houston, TX',
    grossFloorAreaSqm: 65000,
    startDate: '2026-06-01',
    targetCompletionDate: '2026-12-15',
    plannedDeliveryDate: undefined,
    actualDeliveredDate: undefined,
    status: 'WIP',
    totalEstimatedHours: 0.0,
    totalCompletedHours: 4.0,
    currentLOD: 'LOD 300',
    targetLOD: 'LOD 350',
    budgetAmount: 220000,
    description: 'High-voltage GIS switchgear, 138kV oil-filled transformers, underground concrete duct banks, and lightning protection masts.',
    disciplines: ['MEP - Electrical', 'Coordination & QA'],
    assignedEmployeeIds: ['emp-2'],
    milestones: [
      {
        id: 'ms-1201',
        title: 'Transformer Yard Containment & Cable Vault Submittal',
        targetDate: '2026-12-15',
        status: 'in-progress',
        deliverableDescription: 'Underground conduit sweep radius and oil containment pit coordination.',
        lodRequirement: 'LOD 350'
      }
    ],
    tasks: [
      {
        id: 'tsk-1201',
        projectId: 'proj-12',
        name: 'Underground PVC Duct Bank & Pull Vault Routing',
        discipline: 'MEP - Electrical',
        lod: 'LOD 300',
        estimatedHours: 400,
        completedHours: 4,
        status: 'In Progress',
        assignedEmployeeId: 'emp-2',
        dueDate: '2026-12-15'
      }
    ],
    clashes: []
  }
];

export const generateInitialWorkLogs = (): DailyWorkLog[] => {
  return [
    // London Wall Gym (Total: 30h)
    {
      id: 'log-101',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-1',
      projectName: 'London Wall Gym',
      date: '2026-08-18',
      hoursLogged: 14.0,
      discipline: 'MEP - HVAC',
      activityType: '3D Detailed Modeling',
      taskName: 'Gym Main Hall Exposed Spiral Ducting & Diffusers',
      lodStage: 'LOD 350',
      notes: 'Modeled spiral supply air ductwork with custom acoustic hanging brackets.',
      billable: true,
      timestamp: '2026-08-18T14:30:00Z'
    },
    {
      id: 'log-102',
      employeeId: 'emp-aditi',
      employeeName: 'Aditi',
      projectId: 'proj-1',
      projectName: 'London Wall Gym',
      date: '2026-08-17',
      hoursLogged: 10.0,
      discipline: 'BIM - ACS',
      activityType: 'Construction Documentation & Sheets',
      taskName: 'Acoustic Wall Paneling & Mezzanine Framing',
      lodStage: 'LOD 300',
      notes: 'Detailed mezzanine acoustic timber batten wall panels and floor junctions.',
      billable: true,
      timestamp: '2026-08-17T16:00:00Z'
    },
    {
      id: 'log-103',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-1',
      projectName: 'London Wall Gym',
      date: '2026-08-16',
      hoursLogged: 6.0,
      discipline: 'Coordination & QA',
      activityType: 'Clash Detection & Resolution',
      taskName: 'Multi-Discipline Clash Verification Audit',
      lodStage: 'LOD 350',
      notes: 'Executed weekly Navisworks matrix check; verified 2.8m headroom clearances.',
      billable: true,
      timestamp: '2026-08-16T17:00:00Z'
    },

    // Watermark Podium Garage (Total: 18h)
    {
      id: 'log-201',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-2',
      projectName: 'Watermark Podium Garage',
      date: '2026-08-18',
      hoursLogged: 10.0,
      discipline: 'MEP - Plumbing',
      activityType: '3D Detailed Modeling',
      taskName: 'Parking Deck 1-4 Sloped Drainage & Storm Headers',
      lodStage: 'LOD 350',
      notes: 'Modeled cast iron sanitary and storm drainage lines with 1:100 slope gradient.',
      billable: true,
      timestamp: '2026-08-18T15:00:00Z'
    },
    {
      id: 'log-202',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-2',
      projectName: 'Watermark Podium Garage',
      date: '2026-08-17',
      hoursLogged: 8.0,
      discipline: 'MEP - HVAC',
      activityType: '3D Detailed Modeling',
      taskName: 'Jet Fan Ventilation System & Carbon Monoxide Exhaust',
      lodStage: 'LOD 350',
      notes: 'Positioned ceiling-mounted induction jet fans and carbon monoxide sensor triggers.',
      billable: true,
      timestamp: '2026-08-17T14:00:00Z'
    },

    // New Bugesera International Airport (Total: 268h)
    {
      id: 'log-301',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-3',
      projectName: 'New Bugesera International Airport',
      date: '2026-08-18',
      hoursLogged: 160.0,
      discipline: 'Structure',
      activityType: '3D Detailed Modeling',
      taskName: 'Terminal Wing Curved Roof Trusses & Skylight Embeds',
      lodStage: 'LOD 350',
      notes: 'Completed structural framing for concourse roof trusses and perimeter glazing anchors.',
      billable: true,
      timestamp: '2026-08-18T12:00:00Z'
    },
    {
      id: 'log-302',
      employeeId: 'emp-aditi',
      employeeName: 'Aditi',
      projectId: 'proj-3',
      projectName: 'New Bugesera International Airport',
      date: '2026-08-18',
      hoursLogged: 108.0,
      discipline: 'Coordination & QA',
      activityType: 'Coordination & Navisworks Review',
      taskName: 'Passenger Gates 1-16 Navisworks Coordination Audit',
      lodStage: 'LOD 350',
      notes: 'Multi-trade clash resolution session on concourse jet bridge utility connections.',
      billable: true,
      timestamp: '2026-08-18T16:30:00Z'
    },

    // Evanston Water Plant (Total: 99h)
    {
      id: 'log-401',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-4',
      projectName: 'Evanston Water Plant',
      date: '2026-08-18',
      hoursLogged: 99.0,
      discipline: 'MEP - Plumbing',
      activityType: '3D Detailed Modeling',
      taskName: 'Pump Station Manifold Spool Detailing',
      lodStage: 'LOD 350',
      notes: 'Detailed stainless steel chemical feed headers and pump suction/discharge skids.',
      billable: true,
      timestamp: '2026-08-18T17:00:00Z'
    },

    // 6-8 E 82nd (Total: 32h)
    {
      id: 'log-501',
      employeeId: 'emp-aditi',
      employeeName: 'Aditi',
      projectId: 'proj-5',
      projectName: '6-8 E 82nd',
      date: '2026-08-18',
      hoursLogged: 32.0,
      discipline: 'BIM - ACS',
      activityType: 'Scan-to-BIM Point Cloud Modeling',
      taskName: 'Limestone Facade & Carved Cornice Parametric Modeling',
      lodStage: 'LOD 350',
      notes: 'Fitted Revit parametric profile families onto Registered Leica point cloud scans.',
      billable: true,
      timestamp: '2026-08-18T18:00:00Z'
    },

    // 90 Furman (Total: 3h)
    {
      id: 'log-601',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-6',
      projectName: '90 Furman',
      date: '2026-08-18',
      hoursLogged: 3.0,
      discipline: 'MEP - Electrical',
      activityType: '3D Detailed Modeling',
      taskName: 'Emergency Generator & ATS Busduct Routing',
      lodStage: 'LOD 350',
      notes: 'Modeled emergency feeder conduits and automatic transfer switch enclosure.',
      billable: true,
      timestamp: '2026-08-18T11:00:00Z'
    },

    // Evanston Water Plant Facility (Total: 8h)
    {
      id: 'log-801',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-8',
      projectName: 'Evanston Water Plant Facility',
      date: '2026-08-18',
      hoursLogged: 8.0,
      discipline: 'Structure',
      activityType: 'Parametric Family Creation',
      taskName: 'Gantry Crane Runway Beams & Stiffener Plates',
      lodStage: 'LOD 350',
      notes: 'Modeled heavy gantry rail brackets and anchor embedment plates.',
      billable: true,
      timestamp: '2026-08-18T15:30:00Z'
    },

    // Watermark Podium Structure (Total: 6h)
    {
      id: 'log-901',
      employeeId: 'emp-aditi',
      employeeName: 'Aditi',
      projectId: 'proj-9',
      projectName: 'Watermark Podium Structure',
      date: '2026-08-18',
      hoursLogged: 6.0,
      discipline: 'Façade / Envelope',
      activityType: 'Parametric Family Creation',
      taskName: 'Perforated Louver Screen Anchor Brackets',
      lodStage: 'LOD 350',
      notes: 'Generated Dynamo script for variable-aperture perforated facade panel distribution.',
      billable: true,
      timestamp: '2026-08-18T16:00:00Z'
    },

    // Buxton (Total: 9h)
    {
      id: 'log-1001',
      employeeId: 'emp-aditi',
      employeeName: 'Aditi',
      projectId: 'proj-10',
      projectName: 'Buxton',
      date: '2026-08-18',
      hoursLogged: 9.0,
      discipline: 'BIM - ACS',
      activityType: '2D to 3D Conversion',
      taskName: 'Industrial Shed Revit Geometry & Wall Types Setup',
      lodStage: 'LOD 300',
      notes: 'Rebuilt 2D CAD DWG layers into parametric Revit system wall assemblies.',
      billable: true,
      timestamp: '2026-08-18T13:00:00Z'
    },

    // 6-8 E 82nd Townhouse (Total: 19h)
    {
      id: 'log-1101',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-11',
      projectName: '6-8 E 82nd Townhouse',
      date: '2026-08-18',
      hoursLogged: 19.0,
      discipline: 'MEP - Plumbing',
      activityType: 'Clash Detection & Resolution',
      taskName: 'Plumbing Risers Fit Verification in Tight Chases',
      lodStage: 'LOD 350',
      notes: 'Rerouted waste and vent stack through brick shaft to clear historic joists.',
      billable: true,
      timestamp: '2026-08-18T17:30:00Z'
    },

    // TPN Electrical (Total: 4h)
    {
      id: 'log-1201',
      employeeId: 'emp-2',
      employeeName: 'Sushovan Das',
      projectId: 'proj-12',
      projectName: 'TPN Electrical',
      date: '2026-08-18',
      hoursLogged: 4.0,
      discipline: 'MEP - Electrical',
      activityType: 'COBie & Asset Data Entry',
      taskName: 'Underground PVC Duct Bank & Pull Vault Routing',
      lodStage: 'LOD 300',
      notes: 'Set up electrical conduit run schedules and equipment parameter mapping.',
      billable: true,
      timestamp: '2026-08-18T18:00:00Z'
    }
  ];
};
