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

  async getUtilisateur(id: string) {
    const response = await fetch(`${this.baseUrl}/utilisateurs/${id}`);
    if (response.status === 404) return null;
    return response.json();
  }

  async updateUtilisateur(id: string, data: any) {
    const response = await fetch(`${this.baseUrl}/utilisateurs/${id}`, {
      method: 'PATCH',
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
    console.log('Toya');
    return response.json();
  }

  async getCampusActifs() {
    const response = await fetch(`${this.baseUrl}/campuss/actif`);
    return response.json();
  }

  async createCampus(data: any) {
    const response = await fetch(`${this.baseUrl}/campuss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateCampus(id: string, data: any) {
    const response = await fetch(`${this.baseUrl}/campuss/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getFormations() {
    const response = await fetch(`${this.baseUrl}/formations`);
    return response.json();
  }

  async getFormationsActives() {
    const response = await fetch(`${this.baseUrl}/formations/actif`);
    return response.json();
  }

  async createFormation(data: any) {
    const response = await fetch(`${this.baseUrl}/formations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async updateFormation(id: string, data: any) {
    const response = await fetch(`${this.baseUrl}/formations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async getIdentification(id: string) {
    const response = await fetch(`${this.baseUrl}/identifications/${id}`);
    if (response.status === 404) return null;
    return response.json();
}

}

export const apiService = new ApiService();