const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('peoplecore_token');
    }
    return null;
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data.data;
  }

  // Auth
  public static async login(credentials: { email: string; password: string }) {
    const res = await this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('peoplecore_token', res.accessToken);
      localStorage.setItem('peoplecore_user', JSON.stringify(res.user));
    }
    return res;
  }

  public static logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('peoplecore_token');
      localStorage.removeItem('peoplecore_user');
      window.location.href = '/login';
    }
  }

  // Attendance
  public static async checkIn(notes?: string) {
    return this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public static async checkOut() {
    return this.request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Leave
  public static async submitLeaveRequest(payload: any) {
    return this.request('/leaves/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Payroll
  public static async triggerPayrollRun(payload: any) {
    return this.request('/payroll/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public static async exportNachaAch(periodId: string) {
    return this.request('/payroll/export/bank', {
      method: 'POST',
      body: JSON.stringify({ periodId }),
    });
  }
}
