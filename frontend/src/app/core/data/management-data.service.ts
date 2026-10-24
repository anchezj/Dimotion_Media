import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export const campaignStages = ['Pago', 'Guion', 'Grabación', 'Cambios', 'Entrega'] as const;
export type CampaignStage = (typeof campaignStages)[number];
export type CampaignStatus = 'active' | 'paused' | 'closed';

export interface CampaignRecord {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  date: string;
  time: string;
  stageIndex: number;
  status: CampaignStatus;
  observation: string;
  createdAt: string;
  stageDates: string[];
  closedCampaigns: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  closedCampaigns: number;
}

@Injectable({ providedIn: 'root' })
export class ManagementDataService {
  private readonly http = inject(HttpClient);
  readonly campaigns = signal<CampaignRecord[]>([]);
  readonly clients = signal<ClientRecord[]>([]);
  readonly storageError = signal('');
  readonly currentClient = signal<ClientRecord | null>(null);

  constructor() {
    globalThis.localStorage.removeItem('dimotion-demo-management-v1');
  }

  async loadAdminData(): Promise<void> {
    this.storageError.set('');
    try {
      const [clients, campaigns] = await Promise.all([
        firstValueFrom(this.http.get<ClientRecord[]>(`${environment.apiUrl}/clients`)),
        firstValueFrom(this.http.get<CampaignRecord[]>(`${environment.apiUrl}/campaigns`)),
      ]);
      this.clients.set(clients);
      this.campaigns.set(campaigns);
    } catch (error) {
      this.setRequestError(error);
      throw error;
    }
  }

  async loadClientData(): Promise<ClientRecord> {
    this.storageError.set('');
    try {
      const [client, campaigns] = await Promise.all([
        firstValueFrom(this.http.get<ClientRecord>(`${environment.apiUrl}/clients/me`)),
        firstValueFrom(this.http.get<CampaignRecord[]>(`${environment.apiUrl}/campaigns`)),
      ]);
      this.currentClient.set(client);
      this.campaigns.set(campaigns);
      return client;
    } catch (error) {
      this.setRequestError(error);
      throw error;
    }
  }

  async createCampaign(input: {
    clientId?: string;
    title: string;
    date: string;
    time: string;
  }): Promise<void> {
    await this.request(
      this.http.post(`${environment.apiUrl}/campaigns`, input),
      'No se pudo guardar la campaña en Supabase.',
    );
    await this.reloadCampaigns();
  }

  async setStage(campaignId: string, stageIndex: number): Promise<void> {
    const nextIndex = Math.max(0, Math.min(campaignStages.length - 1, stageIndex));
    await this.updateCampaign(campaignId, { stageIndex: nextIndex });
  }

  async setCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    await this.updateCampaign(campaignId, { status });
  }

  async setObservation(campaignId: string, observation: string): Promise<void> {
    await this.updateCampaign(campaignId, { observation });
  }

  async setClosedCampaignCount(clientId: string, count: number): Promise<void> {
    await this.request(
      this.http.patch(`${environment.apiUrl}/clients/${clientId}/closed-campaigns`, { count }),
      'No se pudo guardar el contador de campañas.',
    );
    await this.reloadAdminData();
  }

  async createClient(input: Pick<ClientRecord, 'name' | 'email'>): Promise<void> {
    await this.request(
      this.http.post(`${environment.apiUrl}/clients`, input),
      'No se pudo crear el cliente en Supabase.',
    );
    await this.reloadAdminData();
  }

  async updateClient(clientId: string, input: Pick<ClientRecord, 'name' | 'email'>): Promise<void> {
    await this.request(
      this.http.patch(`${environment.apiUrl}/clients/${clientId}`, input),
      'No se pudo actualizar el cliente en Supabase.',
    );
    await this.reloadAdminData();
  }

  async toggleClient(client: ClientRecord): Promise<void> {
    await this.request(
      this.http.patch(`${environment.apiUrl}/clients/${client.id}/active`, { active: !client.active }),
      'No se pudo cambiar el estado del cliente.',
    );
    await this.reloadAdminData();
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.request(
      this.http.delete(`${environment.apiUrl}/clients/${clientId}`),
      'No se pudo eliminar el cliente.',
    );
    await this.reloadAdminData();
  }

  private async updateCampaign(campaignId: string, changes: {
    stageIndex?: number;
    status?: CampaignStatus;
    observation?: string;
  }): Promise<void> {
    await this.request(
      this.http.patch(`${environment.apiUrl}/campaigns/${campaignId}`, changes),
      'No se pudo guardar el cambio de campaña.',
    );
    await this.reloadCampaigns();
  }

  private async reloadCampaigns(): Promise<void> {
    const campaigns = await firstValueFrom(
      this.http.get<CampaignRecord[]>(`${environment.apiUrl}/campaigns`),
    );
    this.campaigns.set(campaigns);
  }

  private async reloadAdminData(): Promise<void> {
    await this.loadAdminData();
  }

  private async request<T>(request: Observable<T>, fallback: string): Promise<T> {
    this.storageError.set('');
    try {
      return await firstValueFrom(request);
    } catch (error) {
      this.setRequestError(error, fallback);
      throw error;
    }
  }

  private setRequestError(error: unknown, fallback = 'No fue posible comunicarse con Supabase.'): void {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = typeof error.error === 'object'
        && error.error !== null
        && 'error' in error.error
        && typeof error.error.error === 'string'
        ? error.error.error
        : '';
      this.storageError.set(apiMessage || fallback);
      return;
    }
    this.storageError.set(error instanceof Error ? error.message : fallback);
  }
}
