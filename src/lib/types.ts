export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Básico' | 'Intermediário' | 'Avançado';
  registrationDate: string;
  status: 'Ativo' | 'Inativo' | 'Pendente';
  paymentStatus: 'Pago' | 'Vencido' | 'Pendente';
  dueDate?: string;
  
  // Dados preenchidos pelo aluno
  dob: string;
  cpf: string;
  tshirtSize: string;
  pantsSize: string;
  phone: string;
  emergencyContacts: string;
  
  // Dados de controle interno
  startDate?: string;
  lastExamDate?: string;
  belt: string; // cor
  medicalHistory?: string;
  generalNotes?: string;
  fikmAnnuityPaid?: boolean;

  // Dados Financeiros
  planType?: 'Mensal' | 'Trimestral' | 'Bolsa';
  planValue?: number;
  lastPaymentDate?: string;
  planExpirationDate?: string;
  paymentCredits?: string;
};

export type RevenueData = {
  month: string;
  revenue: number;
}
