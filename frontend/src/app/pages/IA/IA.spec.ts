import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IA } from './IA';

describe('IA – Risk Dashboard', () => {
  let component: IA;
  let fixture: ComponentFixture<IA>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IA],
    }).compileComponents();

    fixture   = TestBed.createComponent(IA);
    component = fixture.componentInstance;
  });

  // ── Creation ──────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Skeleton loader ───────────────────────────────────────

  it('should show skeleton loader while isLoading is true', () => {
    component.isLoading = true;
    component.hasError  = false;
    component.data      = null;
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css('.skeleton-wrap'));
    expect(skeleton).toBeTruthy();
  });

  it('should hide skeleton loader after data is loaded', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const skeleton = fixture.debugElement.query(By.css('.skeleton-wrap'));
    expect(skeleton).toBeNull();
  });

  // ── Data display ──────────────────────────────────────────

  it('should display the zone name after loading', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const zoneEl = fixture.debugElement.query(By.css('.dash-zone'));
    expect(zoneEl.nativeElement.textContent).toContain('Zarzal');
  });

  it('should display the risk-badge element after loading', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const badge = fixture.debugElement.query(By.css('.risk-badge'));
    expect(badge).toBeTruthy();
    expect(badge.nativeElement.textContent.trim()).toBeTruthy();
  });

  it('should display weather stats after loading', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const stats = fixture.debugElement.queryAll(By.css('.ws-value'));
    expect(stats.length).toBeGreaterThan(0);
  });

  it('should render at least one risk factor', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const factors = fixture.debugElement.queryAll(By.css('.factor-item'));
    expect(factors.length).toBeGreaterThan(0);
  });

  // ── Error state ───────────────────────────────────────────

  it('should show error state when hasError is true', () => {
    component.isLoading = false;
    component.hasError  = true;
    component.data      = null;
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('.error-state'));
    expect(errorEl).toBeTruthy();
  });

  it('should call loadRiskData when retry button is clicked', () => {
    component.isLoading = false;
    component.hasError  = true;
    fixture.detectChanges();

    spyOn(component, 'loadRiskData');
    const btn = fixture.debugElement.query(By.css('.btn-retry'));
    btn.triggerEventHandler('click', null);
    expect(component.loadRiskData).toHaveBeenCalled();
  });

  // ── Helpers ───────────────────────────────────────────────

  it('riskLevelLabel should return readable labels', () => {
    const levels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const expected = ['BAJO', 'MODERADO', 'ALTO', 'CRÍTICO'];
    levels.forEach((level, i) => {
      component.data = { riskLevel: level } as any;
      expect(component.riskLevelLabel()).toBe(expected[i]);
    });
  });

  it('getProgressDash should return a non-empty string for score 50', () => {
    const dash = component.getProgressDash(50);
    expect(dash).toBeTruthy();
    expect(dash.includes(' ')).toBe(true);
  });

  // it('getNeedlePath should return a valid SVG path string', () => {
  //   const path = component.getNeedlePath(50);
  //   expect(path.startsWith('M')).toBe(true);
  //   expect(path.includes('L')).toBe(true);
  // });

  
});

function spyOn(component: IA, arg1: string) {
  throw new Error('Function not implemented.');
}