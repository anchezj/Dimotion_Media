import { DemoDataService } from './demo-data.service';

describe('DemoDataService', () => {
  let store: DemoDataService;

  beforeEach(() => {
    localStorage.clear();
    store = new DemoDataService();
    store.initialize();
  });

  it('initializes the sample clients and campaigns in local storage', () => {
    expect(store.clients()).toHaveLength(4);
    expect(store.campaigns()).toHaveLength(3);
    expect(localStorage.getItem('dimotion-demo-management-v1')).toContain('Ruta Norte Logística');
  });

  it('persists stage changes and supports undo', () => {
    store.setStage('campaign-ruta-norte', 2);
    expect(store.campaigns()[0].stageIndex).toBe(2);
    expect(store.campaigns()[0].stageDates[2]).toBeTruthy();

    store.setStage('campaign-ruta-norte', 0);
    expect(store.campaigns()[0].stageIndex).toBe(0);
    expect(store.campaigns()[0].stageDates[2]).toBe('');
    expect(JSON.parse(localStorage.getItem('dimotion-demo-management-v1') ?? '{}').campaigns[0].stageIndex).toBe(0);
  });

  it('creates and updates a scheduled campaign', () => {
    store.createCampaign({
      clientId: 'test-client',
      clientName: 'Cliente de prueba',
      clientEmail: 'prueba@example.com',
      title: 'Lanzamiento',
      date: '2030-08-16',
      time: '10:30',
    });

    expect(store.campaigns()).toHaveLength(4);
    expect(store.campaigns()[0].title).toBe('Lanzamiento');
    expect(store.clients()[0].email).toBe('prueba@example.com');
  });

  it('supports client creation, editing, activation and removal', () => {
    store.createClient({ name: 'Nuevo cliente', email: 'nuevo@example.com' });
    const created = store.clients()[0];
    expect(created.active).toBe(true);

    store.updateClient(created.id, { name: 'Cliente editado', email: created.email });
    expect(store.clients()[0].name).toBe('Cliente editado');

    store.toggleClient(created.id);
    expect(store.clients()[0].active).toBe(false);

    store.deleteClient(created.id);
    expect(store.clients()).toHaveLength(4);
  });
});
