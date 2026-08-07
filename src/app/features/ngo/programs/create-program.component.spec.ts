import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { CreateProgramComponent } from './create-program.component';
import { environment } from '../../../../environments/environment';

const PROGRAMS = `${environment.apiUrl}/programs`;

describe('CreateProgramComponent', () => {
  let fixture: ComponentFixture<CreateProgramComponent>;
  let component: CreateProgramComponent;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreateProgramComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProgramComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function fillValid(): void {
    component.form.patchValue({
      title: 'Chronic Care Fund',
      expiresAt: '2026-12-01',
      criterionField: 'conditionTags',
      criterionOperator: 'in',
      criterionValue: 'Diabetes, Hypertension',
    });
  }

  it('does not submit an incomplete form', () => {
    component.submit();
    expect(http.match(PROGRAMS).length).toBe(0);
  });

  it('posts the mapped payload', () => {
    fillValid();
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Chronic Care Fund');
    expect(req.request.body.type).toBe('ngo_funding');
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  // 'in' takes a list; sending a bare string would match nothing.
  it('splits a comma list for the "is one of" operator', () => {
    fillValid();
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect(req.request.body.eligibilityCriteria[0].value).toEqual(['Diabetes', 'Hypertension']);
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  it('keeps a single value for non-list operators', () => {
    fillValid();
    component.form.patchValue({ criterionField: 'gender', criterionOperator: 'eq', criterionValue: 'female' });
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect(req.request.body.eligibilityCriteria[0].value).toBe('female');
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  it('converts naira to kobo so money cannot drift', () => {
    fillValid();
    component.form.patchValue({ budgetTotal: 18_500_000 });
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect(req.request.body.budgetTotal).toBe(1_850_000_000);
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  it('omits optional fields left blank rather than sending empty strings', () => {
    fillValid();
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect('focus' in req.request.body).toBeFalse();
    expect('donor' in req.request.body).toBeFalse();
    expect('budgetTotal' in req.request.body).toBeFalse();
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  // The API requires a full ISO datetime; a bare date would 422.
  it('sends the closing date as an ISO datetime', () => {
    fillValid();
    component.submit();

    const req = http.expectOne(PROGRAMS);
    expect(req.request.body.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    req.flush({ data: { id: 'P1' }, traceId: 't' });
  });

  it('returns to the list on success', () => {
    fillValid();
    component.submit();
    http.expectOne(PROGRAMS).flush({ data: { id: 'P1' }, traceId: 't' });

    expect(router.navigate).toHaveBeenCalledWith(['/ngo/programs']);
  });

  it('keeps the form and shows the error on failure', () => {
    fillValid();
    component.submit();
    http.expectOne(PROGRAMS).flush(
      { message: 'expiresAt must be in the future' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(component.error()).toContain('future');
    expect(component.submitting()).toBeFalse();
    expect(component.form.controls.title.value).toBe('Chronic Care Fund');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('offers only eligibility fields the matcher actually understands', () => {
    // An unrecognised field is skipped server-side, which would match everyone.
    expect(component.criterionFields.map(f => f.value)).toEqual([
      'conditionTags',
      'gender',
      'dateOfBirth',
    ]);
  });

  // Every test above drives submit() directly, which is exactly how a form that
  // silently refuses to submit in the browser can still pass its suite. These go
  // through the DOM: type into the inputs, press the button.
  describe('driven through the DOM', () => {
    function type(controlName: string, value: string): void {
      const el: HTMLInputElement = fixture.nativeElement.querySelector(
        `input[formcontrolname="${controlName}"], textarea[formcontrolname="${controlName}"]`,
      );
      el.value = value;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    function submitButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('.cp-submit');
    }

    function fillRequired(): void {
      type('title', 'Chronic Care Fund');
      type('expiresAt', '2026-12-01');
      type('criterionValue', 'Diabetes, Hypertension');
    }

    it('names every unfilled required field, and keeps the button disabled', () => {
      expect(submitButton().disabled).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('Programme name');
      expect(fixture.nativeElement.textContent).toContain('Applications close');
      expect(fixture.nativeElement.textContent).toContain('Who qualifies — value');
    });

    it('drops each field from the list as it is filled', () => {
      type('title', 'Chronic Care Fund');
      expect(component.missing()).toEqual(['Applications close', 'Who qualifies — value']);

      type('expiresAt', '2026-12-01');
      expect(component.missing()).toEqual(['Who qualifies — value']);
    });

    it('enables the button and posts once everything required is filled', () => {
      fillRequired();
      expect(submitButton().disabled).toBeFalse();

      submitButton().click();
      fixture.detectChanges();

      const req = http.expectOne(PROGRAMS);
      expect(req.request.body.title).toBe('Chronic Care Fund');
      req.flush({ data: { id: 'P1' }, traceId: 't' });
    });

    // An optional money field must not block the form — the input's own step
    // constraint used to be the kind of thing that could.
    it('accepts a budget that is not a round number', () => {
      fillRequired();
      type('budgetTotal', '12500');

      submitButton().click();
      fixture.detectChanges();

      const req = http.expectOne(PROGRAMS);
      expect(req.request.body.budgetTotal).toBe(1_250_000);
      req.flush({ data: { id: 'P1' }, traceId: 't' });
    });

    it('shows the failure beside the button, not only at the top of the page', () => {
      fillRequired();
      submitButton().click();
      http.expectOne(PROGRAMS).flush(
        { message: 'Organization must be active to create programs' },
        { status: 403, statusText: 'Forbidden' },
      );
      fixture.detectChanges();

      const actions: HTMLElement = fixture.nativeElement.querySelector('.cp-actions');
      const banner: HTMLElement = fixture.nativeElement.querySelector('.cp-error');
      expect(banner).toBeTruthy();
      // Adjacent to the actions block rather than a page-height away from it.
      expect(banner.nextElementSibling).toBe(actions);
    });

    // The raw API wording reads like a bug rather than "you are awaiting approval".
    it('translates the not-yet-verified refusal into something actionable', () => {
      fillRequired();
      submitButton().click();
      http.expectOne(PROGRAMS).flush(
        { message: 'Organization must be active to create programs' },
        { status: 403, statusText: 'Forbidden' },
      );

      expect(component.error()).toContain('awaiting verification');
    });
  });
});
