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
