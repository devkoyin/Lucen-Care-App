import { Component, computed } from '@angular/core';

interface StateRow {
  state: string;
  zone: string;
  selected: number;
  inReview: number;
  waitlisted: number;
  topCondition: string;
}

const STATE_DATA: StateRow[] = [
  { state: 'Lagos',    zone: 'South-West', selected: 28, inReview: 9, waitlisted: 4, topCondition: 'Hypertension'         },
  { state: 'Abuja',    zone: 'North-Central', selected: 14, inReview: 6, waitlisted: 2, topCondition: 'Type 2 Diabetes'   },
  { state: 'Kano',     zone: 'North-West', selected: 12, inReview: 4, waitlisted: 3, topCondition: 'Sickle Cell Disease'   },
  { state: 'Rivers',   zone: 'South-South', selected: 8,  inReview: 3, waitlisted: 1, topCondition: 'Hypertension'        },
  { state: 'Oyo',      zone: 'South-West', selected: 7,  inReview: 2, waitlisted: 2, topCondition: 'COPD'                 },
  { state: 'Kaduna',   zone: 'North-West', selected: 6,  inReview: 3, waitlisted: 3, topCondition: 'Malnutrition'         },
  { state: 'Anambra',  zone: 'South-East', selected: 5,  inReview: 2, waitlisted: 1, topCondition: 'Sickle Cell Disease'  },
  { state: 'Enugu',    zone: 'South-East', selected: 5,  inReview: 1, waitlisted: 0, topCondition: 'Asthma'               },
  { state: 'Imo',      zone: 'South-East', selected: 4,  inReview: 2, waitlisted: 1, topCondition: 'Hypertension'         },
  { state: 'Osun',     zone: 'South-West', selected: 4,  inReview: 1, waitlisted: 1, topCondition: 'Heart Disease'        },
  { state: 'Bauchi',   zone: 'North-East', selected: 3,  inReview: 2, waitlisted: 2, topCondition: 'Sickle Cell Disease'  },
  { state: 'Delta',    zone: 'South-South', selected: 3,  inReview: 1, waitlisted: 0, topCondition: 'Diabetes'            },
];

interface ZoneSummary {
  zone: string;
  total: number;
  color: string;
}

@Component({
  selector: 'lc-patient-map',
  standalone: true,
  imports: [],
  templateUrl: './patient-map.component.html',
  styleUrl: './patient-map.component.scss',
})
export class PatientMapComponent {
  readonly states = STATE_DATA;

  readonly totalSelected = computed(() =>
    STATE_DATA.reduce((s, r) => s + r.selected, 0)
  );

  readonly totalInReview = computed(() =>
    STATE_DATA.reduce((s, r) => s + r.inReview, 0)
  );

  readonly totalWaitlisted = computed(() =>
    STATE_DATA.reduce((s, r) => s + r.waitlisted, 0)
  );

  readonly statesReached = STATE_DATA.length;

  readonly zoneSummaries: ZoneSummary[] = [
    { zone: 'South-West',    total: STATE_DATA.filter(r => r.zone === 'South-West').reduce((s, r) => s + r.selected, 0),    color: '#059669' },
    { zone: 'North-West',    total: STATE_DATA.filter(r => r.zone === 'North-West').reduce((s, r) => s + r.selected, 0),    color: '#2563EB' },
    { zone: 'South-East',    total: STATE_DATA.filter(r => r.zone === 'South-East').reduce((s, r) => s + r.selected, 0),    color: '#7C3AED' },
    { zone: 'North-Central', total: STATE_DATA.filter(r => r.zone === 'North-Central').reduce((s, r) => s + r.selected, 0), color: '#D97706' },
    { zone: 'South-South',   total: STATE_DATA.filter(r => r.zone === 'South-South').reduce((s, r) => s + r.selected, 0),   color: '#0891B2' },
    { zone: 'North-East',    total: STATE_DATA.filter(r => r.zone === 'North-East').reduce((s, r) => s + r.selected, 0),    color: '#DC2626' },
  ];

  barWidth(selected: number): number {
    const max = Math.max(...STATE_DATA.map(r => r.selected));
    return Math.round((selected / max) * 100);
  }

  zoneColor(zone: string): string {
    return this.zoneSummaries.find(z => z.zone === zone)?.color ?? '#6B7280';
  }
}
