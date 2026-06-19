export interface Barber {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  active: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface BarberService {
  barber_id: string;
  service_id: string;
  services?: Service;
}

export interface WorkingHour {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BlockedSlot {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  active: boolean;
  created_at: string;
  plan_services?: { service_id: string; services?: Service }[];
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface ClientSubscription {
  id: string;
  client_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: "active" | "past_due" | "canceled" | "paused";
  current_period_end: string | null;
  created_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface Appointment {
  id: string;
  barber_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
  notes: string | null;
  created_at: string;
  barbers?: Barber;
  services?: Service;
}
