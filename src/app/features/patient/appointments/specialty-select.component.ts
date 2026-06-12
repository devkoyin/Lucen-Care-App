import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';

interface SpecialtyGroup {
  category: string;
  bg: string;
  text: string;
  accent: string;
  items: string[];
}

export const SPECIALTY_GROUPS: SpecialtyGroup[] = [
  {
    category: 'Primary Care',
    bg: '#D1FAE5', text: '#065F46', accent: '#059669',
    items: ['General Practice', 'Internal Medicine', 'Emergency Medicine', 'Geriatrics', 'Palliative Care', 'Occupational Medicine'],
  },
  {
    category: 'Cardiology & Vascular',
    bg: '#FEE2E2', text: '#991B1B', accent: '#DC2626',
    items: ['Cardiology', 'Cardiothoracic Surgery', 'Vascular Surgery'],
  },
  {
    category: 'Neurology & Mental Health',
    bg: '#EDE9FE', text: '#5B21B6', accent: '#7C3AED',
    items: ['Neurology', 'Neurosurgery', 'Psychiatry & Mental Health'],
  },
  {
    category: 'Surgical',
    bg: '#DBEAFE', text: '#1E40AF', accent: '#2563EB',
    items: ['General Surgery', 'Orthopaedic Surgery', 'ENT (Ear, Nose & Throat)', 'Oral & Maxillofacial Surgery', 'Plastic & Reconstructive Surgery', 'Urology'],
  },
  {
    category: "Women's & Paediatric Health",
    bg: '#FCE7F3', text: '#9D174D', accent: '#DB2777',
    items: ['Gynaecology & Obstetrics', 'Paediatrics', 'Neonatology', 'Sexual & Reproductive Health'],
  },
  {
    category: 'Diagnostic & Laboratory',
    bg: '#FEF3C7', text: '#92400E', accent: '#D97706',
    items: ['Radiology', 'Interventional Radiology', 'Pathology'],
  },
  {
    category: 'Medical Specialties',
    bg: '#E0E7FF', text: '#3730A3', accent: '#4F46E5',
    items: ['Endocrinology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Rheumatology', 'Haematology', 'Oncology', 'Infectious Disease', 'Allergy & Immunology', 'Dermatology', 'Ophthalmology'],
  },
  {
    category: 'Allied Health',
    bg: '#CCFBF1', text: '#134E4A', accent: '#0D9488',
    items: ['Physiotherapy & Rehabilitation', 'Nutrition & Dietetics', 'Sports Medicine', 'Anaesthesiology'],
  },
];

@Component({
  selector: 'lc-specialty-select',
  standalone: true,
  templateUrl: './specialty-select.component.html',
  styleUrl: './specialty-select.component.scss',
})
export class SpecialtySelectComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly groups = SPECIALTY_GROUPS;
  readonly open = signal(false);

  private readonly el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.open.set(false);
    }
  }

  toggle(e: MouseEvent): void {
    e.stopPropagation();
    this.open.update(v => !v);
  }

  select(item: string): void {
    this.valueChange.emit(item);
    this.open.set(false);
  }

  groupForValue(): SpecialtyGroup | undefined {
    return this.groups.find(g => g.items.includes(this.value));
  }
}
