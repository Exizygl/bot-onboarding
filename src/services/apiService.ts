import { config } from '../config/config';

export class ApiService {
  private baseUrl = config.apiBaseUrl;

  async getPromos() {
    const response = await fetch(`${this.baseUrl}/promos`);
    return response.json();
  }

  async getPromosToStart() {
    const response = await fetch(`${this.baseUrl}/promos/to-start`);
    return response.json();
  }

  async getPromosToArchive() {
    const response = await fetch(`${this.baseUrl}/promos/to-archive`);
    return response.json();
  }

  async createPromo(data: any) {
    const response = await fetch(`${this.baseUrl}/promos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updatePromo(id: string, data: any) {
    const response = await fetch(`${this.baseUrl}/promos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async createUtilisateur(data: any) {
    const response = await fetch(`${this.baseUrl}/utilisateurs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async createIdentification(data: any) {
    const response = await fetch(`${this.baseUrl}/identifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateIdentification(id: string, statutId: number) {
    const response = await fetch(`${this.baseUrl}/identifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statutIdentificationId: statutId }),
    });
    return response.json();
  }

  async getCampus() {
    const response = await fetch(`${this.baseUrl}/campuss`);
    return response.json();
  }

  async getFormations() {
    const response = await fetch(`${this.baseUrl}/formations`);
    return response.json();
  }
}

export const apiService = new ApiService();