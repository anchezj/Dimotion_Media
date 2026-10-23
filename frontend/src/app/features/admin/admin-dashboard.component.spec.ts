import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DemoDataService } from '../../core/demo/demo-data.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the campaign controls and stage actions', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.campaign-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.admin-step').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('select[aria-label="Estado de Ruta Norte Logística"]')).toBeTruthy();
  });

  it('creates a client and persists it for the administration list', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    component.openCreateClient();
    component.clientName = 'Cliente nuevo';
    component.clientEmail = 'nuevo@example.com';
    component.saveClient();

    expect(TestBed.inject(DemoDataService).clients()[0].name).toBe('Cliente nuevo');
  });
});
