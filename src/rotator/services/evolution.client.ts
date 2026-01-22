import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  EvolutionGroupInfo,
  EvolutionCreateGroupResponse,
  EvolutionCreateInviteResponse,
} from '../../types';

export class EvolutionClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apikey: string;

  constructor() {
    const { config } = require('../../config/env');
    this.baseUrl = config.evolutionBaseUrl;
    this.apikey = config.evolutionApikey;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 8000,
      headers: {
        apikey: this.apikey,
        'Content-Type': 'application/json',
      },
    });
  }

  private async requestWithRetry<T>(
    fn: () => Promise<T>,
    retries = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        return await this.requestWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  async createGroup(
    instance: string,
    subject: string
  ): Promise<EvolutionCreateGroupResponse> {
    return this.requestWithRetry(async () => {
      try {
        const response = await this.client.post<EvolutionCreateGroupResponse>(
          `/group/create/${instance}`,
          {
            subject,
            participants: [
              '5522992379748',
              '5521980967727',
            ],
          }
        );
        return response.data;
      } catch (error: any) {
        // Log detalhes do erro para debug
        if (error.response) {
          console.error('[Evolution API] Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
            dataSent: error.config?.data,
          });
        }
        throw error;
      }
    });
  }

  async getGroupInfo(
    instance: string,
    jid: string
  ): Promise<EvolutionGroupInfo> {
    return this.requestWithRetry(async () => {
      const response = await this.client.get<EvolutionGroupInfo>(
        `/group/fetchGroupInfoFromWhatsApp/${instance}`,
        {
          params: { groupJid: jid },
        }
      );
      return response.data;
    });
  }

  async setGroupPhoto(
    instance: string,
    jid: string,
    photoUrl: string
  ): Promise<void> {
    return this.requestWithRetry(async () => {
      await this.client.post(`/group/updateGroupPicture/${instance}`, 
        { image: photoUrl },
        { params: { groupJid: jid } }
      );
    });
  }

  async setGroupDescription(
    instance: string,
    jid: string,
    description: string
  ): Promise<void> {
    return this.requestWithRetry(async () => {
      await this.client.post(`/group/updateGroupDescription/${instance}`,
        { description },
        { params: { groupJid: jid } }
      );
    });
  }

  async createInvite(
    instance: string,
    jid: string
  ): Promise<EvolutionCreateInviteResponse> {
    return this.requestWithRetry(async () => {
      try {
        // Evolution API v2.2.2: GET com query parameter (não POST com body)
        const response = await this.client.get<EvolutionCreateInviteResponse>(
          `/group/inviteCode/${instance}`,
          {
            params: { groupJid: jid },
          }
        );
        const data = response.data;
        
        // Normalizar o retorno para garantir que temos inviteUrl
        if (data.code && !data.inviteUrl && !data.url) {
          return {
            ...data,
            inviteUrl: `https://chat.whatsapp.com/${data.code}`,
            url: `https://chat.whatsapp.com/${data.code}`,
          };
        }
        
        return data;
      } catch (error: any) {
        // Log detalhes do erro para debug
        if (error.response) {
          console.error('[Evolution API] createInvite error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
          });
        }
        throw error;
      }
    });
  }
}
