import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'super-admin' | 'admin' | 'user';

const normalizeRole = (role: string): Role => {
  if (role === 'superadmin' || role === 'super_admin' || role === 'super-admin') return 'super-admin';
  if (role === 'admin') return 'admin';
  return 'user';
};

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Beverages';
  available: boolean;
  images: string[];
  description?: string;
}

export interface User {
  id: string;
  emp_id: number;
  emp_name: string;
  emp_mail: string;
  password: string;
  role: 'admin' | 'user';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: Date;
}

interface AppState {
  currentRole: Role;
  setRole: (role: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  todaysMenu: string[];
  setTodaysMenu: (ids: string[]) => void;
  todaysSpecial: string | null;
  setTodaysSpecial: (id: string | null) => void;

  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

const sampleProducts: Product[] = [];
const sampleOrders: Order[] = [];

const sampleUsers: User[] = [
  { id: '1', emp_id: 1, emp_name: 'Shyam', emp_mail: 'shyam@gmail.com', password: 'Shyam@08', role: 'admin' },
  { id: '2', emp_id: 2, emp_name: 'Priya', emp_mail: 'priya@gmail.com', password: 'Priya@08', role: 'user' },
  { id: '3', emp_id: 3, emp_name: 'Rahul', emp_mail: 'rahul@gmail.com', password: 'Rahul@08', role: 'user' },
];

export const useAppStore = create<AppState>()(persist((set) => ({
  currentRole: 'super-admin',
  setRole: (role) => set({ currentRole: normalizeRole(role) }),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  products: [],
  addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
  updateProduct: (id, data) => set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
  deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  users: sampleUsers,
  addUser: (user) => set((s) => ({ users: [...s.users, user] })),
  updateUser: (id, data) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)) })),
  deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

  todaysMenu: [],
  setTodaysMenu: (ids) => set({ todaysMenu: ids }),
  todaysSpecial: '4',
  setTodaysSpecial: (id) => set({ todaysSpecial: id }),

  cart: [],
  addToCart: (product) => set((s) => {
    const existing = s.cart.find((c) => c.product.id === product.id);
    if (existing) return { cart: s.cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c) };
    return { cart: [...s.cart, { product, quantity: 1 }] };
  }),
  removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),
  updateCartQty: (productId, qty) => set((s) => {
    if (qty <= 0) return { cart: s.cart.filter((c) => c.product.id !== productId) };
    return { cart: s.cart.map((c) => c.product.id === productId ? { ...c, quantity: qty } : c) };
  }),
  clearCart: () => set({ cart: [] }),

  orders: [],
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
  updateOrderStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
}), { name: 'cafeai-store', partialize: (s) => ({ currentRole: s.currentRole }) }));
