import { Injectable, signal } from '@angular/core';

export const campaignStages = ['Pago', 'Guion', 'Grabación', 'Cambios', 'Entrega'] as const;
export type CampaignStage = (typeof campaignStages)[number];
export type CampaignStatus = 'active' | 'paused' | 'closed';

export interface DemoCampaign {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  title: string;
  date: string;
  time: string;
  stageIndex: number;
  closedCampaigns?: number;
  status: CampaignStatus;
  observation: string;
  createdAt: string;
  stageDates: string[];
}

export interface DemoClient {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface DemoData {
  campaigns: DemoCampaign[];
  clients: DemoClient[];
}

const storageKey = 'dimotion-demo-management-v1';

function createSeedData(): DemoData {
  const now = new Date();
  const sampleDate = (day: number, hour: number): string => {
    const date = new Date(now.getFullYear(), now.getMonth(), day, hour, 30);
    return date.toISOString();
  };

  const clients: DemoClient[] = [
    { id: 'client-ruta-norte', name: 'Ruta Norte Logística', email: 'contacto@rutanorte.co', active: true, createdAt: '2026-07-19' },
    { id: 'client-cafe-andino', name: 'Café Andino', email: 'hola@cafeandino.co', active: true, createdAt: '2026-05-02' },
    { id: 'client-buffalo-wings', name: 'Buffalo Wings', email: 'marketing@buffalowings.co', active: true, createdAt: '2026-03-12' },
    { id: 'client-moda-terraza', name: 'Moda Terraza', email: 'equipo@modaterraza.co', active: false, createdAt: '2025-11-30' },
  ];

  return {
    clients,
    campaigns: [
      {
        id: 'campaign-ruta-norte',
        clientId: clients[0].id,
        clientName: clients[0].name,
        title: 'Contenido institucional',
        date: new Date(now.getFullYear(), now.getMonth(), 22).toISOString().slice(0, 10),
        time: '18:54',
        stageIndex: 1,
        closedCampaigns: 3,
        status: 'active',
        observation: '',
        createdAt: clients[0].createdAt,
        stageDates: [sampleDate(22, 18), '', '', '', ''],
      },
      {
        id: 'campaign-cafe-andino',
        clientId: clients[1].id,
        clientName: clients[1].name,
        title: 'Campaña de temporada',
        date: new Date(now.getFullYear(), now.getMonth(), 19).toISOString().slice(0, 10),
        time: '16:20',
        stageIndex: 1,
        closedCampaigns: 3,
        status: 'paused',
        observation: 'Esperando aprobación del nuevo guion.',
        createdAt: clients[1].createdAt,
        stageDates: [sampleDate(19, 16), '', '', '', ''],
      },
      {
        id: 'campaign-buffalo-wings',
        clientId: clients[2].id,
        clientName: clients[2].name,
        title: 'Campaña de temporada',
        date: new Date(now.getFullYear(), now.getMonth(), 14).toISOString().slice(0, 10),
        time: '09:15',
        stageIndex: 2,
        closedCampaigns: 4,
        status: 'active',
        observation: 'Campaña de temporada en curso.',
        createdAt: clients[2].createdAt,
        stageDates: [sampleDate(14, 9), sampleDate(22, 18), '', '', ''],
      },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  readonly campaigns = signal<DemoCampaign[]>([]);
  readonly clients = signal<DemoClient[]>([]);
  readonly storageError = signal('');
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const stored = globalThis.localStorage.getItem(storageKey);
      if (stored === null) {
        const seed = createSeedData();
        this.save(seed);
        return;
      }
      const parsed: unknown = JSON.parse(stored);
      if (!this.isDemoData(parsed)) {
        throw new Error('Los datos locales de demostración tienen un formato inválido.');
      }
      this.campaigns.set(parsed.campaigns);
      this.clients.set(parsed.clients);
    } catch (error) {
      this.storageError.set(
        error instanceof Error ? error.message : 'No se pudieron leer los datos guardados en este navegador.',
      );
    }
  }

  createCampaign(input: {
    clientId: string;
    clientName: string;
    clientEmail: string;
    title: string;
    date: string;
    time: string;
  }): void {
    const existingClient = this.clients().some((client) => client.id === input.clientId);
    const clients = existingClient
      ? this.clients()
      : [{
        id: input.clientId,
        name: input.clientName,
        email: input.clientEmail,
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      }, ...this.clients()];
    const campaign: DemoCampaign = {
      ...input,
      id: globalThis.crypto.randomUUID(),
      stageIndex: 0,
      status: 'active',
      observation: '',
      createdAt: new Date().toISOString(),
      stageDates: [new Date(`${input.date}T${input.time}:00`).toISOString(), '', '', '', ''],
    };
    this.save({ campaigns: [campaign, ...this.campaigns()], clients });
  }

  createClientForSession(id: string, name: string, email: string): void {
    if (this.clients().some((client) => client.id === id)) return;
    this.save({
      campaigns: this.campaigns(),
      clients: [{
        id,
        name,
        email,
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      }, ...this.clients()],
    });
  }

  setStage(campaignId: string, stageIndex: number): void {
    this.updateCampaign(campaignId, (campaign) => {
      const nextIndex = Math.max(0, Math.min(campaignStages.length - 1, stageIndex));
      const stageDates = [...campaign.stageDates];
      if (nextIndex > campaign.stageIndex) {
        for (let index = campaign.stageIndex + 1; index <= nextIndex; index += 1) {
          stageDates[index] = new Date().toISOString();
        }
      } else {
        for (let index = nextIndex + 1; index < stageDates.length; index += 1) {
          stageDates[index] = '';
        }
      }
      return {
        ...campaign,
        stageIndex: nextIndex,
        status: nextIndex === campaignStages.length - 1
          ? 'closed'
          : campaign.status === 'closed' ? 'active' : campaign.status,
        stageDates,
      };
    });
  }

  setCampaignStatus(campaignId: string, status: CampaignStatus): void {
    this.updateCampaign(campaignId, (campaign) => ({ ...campaign, status }));
  }

  setObservation(campaignId: string, observation: string): void {
    this.updateCampaign(campaignId, (campaign) => ({ ...campaign, observation }));
  }

  setClosedCampaignCount(campaignId: string, count: number): void {
    this.updateCampaign(campaignId, (campaign) => ({ ...campaign, closedCampaigns: count }));
  }

  createClient(input: Pick<DemoClient, 'name' | 'email'>): void {
    const client: DemoClient = {
      ...input,
      id: globalThis.crypto.randomUUID(),
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.save({ campaigns: this.campaigns(), clients: [client, ...this.clients()] });
  }

  updateClient(clientId: string, input: Pick<DemoClient, 'name' | 'email'>): void {
    const clients = this.clients().map((client) =>
      client.id === clientId ? { ...client, ...input } : client,
    );
    const campaigns = this.campaigns().map((campaign) => {
      const client = clients.find((item) => item.id === campaign.clientId);
      return client ? { ...campaign, clientName: client.name } : campaign;
    });
    this.save({ campaigns, clients });
  }

  toggleClient(clientId: string): void {
    this.save({
      campaigns: this.campaigns(),
      clients: this.clients().map((client) =>
        client.id === clientId ? { ...client, active: !client.active } : client,
      ),
    });
  }

  deleteClient(clientId: string): void {
    this.save({
      campaigns: this.campaigns(),
      clients: this.clients().filter((client) => client.id !== clientId),
    });
  }

  private updateCampaign(
    campaignId: string,
    update: (campaign: DemoCampaign) => DemoCampaign,
  ): void {
    this.save({
      campaigns: this.campaigns().map((campaign) =>
        campaign.id === campaignId ? update(campaign) : campaign,
      ),
      clients: this.clients(),
    });
  }

  private save(data: DemoData): void {
    try {
      globalThis.localStorage.setItem(storageKey, JSON.stringify(data));
      this.campaigns.set(data.campaigns);
      this.clients.set(data.clients);
      this.storageError.set('');
    } catch (error) {
      this.storageError.set(
        error instanceof Error ? error.message : 'No se pudieron guardar los datos en este navegador.',
      );
      throw error;
    }
  }

  private isDemoData(value: unknown): value is DemoData {
    if (typeof value !== 'object' || value === null) return false;
    const data = value as Partial<DemoData>;
    return Array.isArray(data.campaigns) && Array.isArray(data.clients);
  }
}
