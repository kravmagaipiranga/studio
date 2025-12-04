
export type Student = {
  id: string;
  name: string;
  email: string;
  plan?: 'Básico' | 'Intermediário' | 'Avançado';
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
  fikmAnnuityPaymentDate?: string;
  fikmAnnuityPaymentMethod?: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
  readyForReview?: boolean;


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

export type Exam = {
  id: string;
  studentId: string;
  studentName: string;
  studentCpf: string;
  studentAge: number;
  examDate: string;
  targetBelt: string;
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  paymentAmount: number;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
};

export type Seminar = {
  id: string;
  topic: string;
  studentId: string;
  studentName: string;
  studentBelt: string;
  studentCpf: string;
  studentAge: number;
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  paymentAmount: number;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
};

export type PrivateClass = {
  id: string;
  studentId: string;
  studentName: string;
  studentBelt: string;
  classDate: string;
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  paymentAmount: number;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
};

export type Appointment = {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  classDate: string;
  classTime: string;
  notes?: string;
};

export type Sale = {
  id: string;
  studentId: string;
  studentName: string;
  item: string;
  value: number;
  date: string;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
  paymentStatus: 'Pago' | 'Pendente';
};
