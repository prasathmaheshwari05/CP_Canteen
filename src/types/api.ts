export interface ApiUser {
  id: string;
  emp_id: number;
  emp_name: string;
  emp_mail: string;
  role: 'superadmin' | 'admin' | 'user';
}

export interface LoginResponse {
  access_token: string;
  role: string;
  emp_name: string;
  emp_mail: string;
  emp_id: number;
  id: string;
}

export interface MyOrder {
  id: string;
  emp_id: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;
}

export interface UpdateUserPayload {
  emp_name: string;
  emp_mail: string;
  role: 'superadmin' | 'admin' | 'user';
  password?: string;
}
