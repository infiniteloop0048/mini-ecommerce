import "next-auth";
import "next-auth/jwt";

// ─── next-auth augmentation ────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// ─── App model types ────────────────────────────────────────────────────────
export type UserRole = "USER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface AppUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  stripePaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}
