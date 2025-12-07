

export type Student = {
  id: string;
  name: string;
  email: string;
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
  planType?: 'Mensal' | 'Trimestral' | 'Bolsa' | 'Outros';
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
  isNew?: boolean; // Flag for new rows in UI
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
  isNew?: boolean; // Flag for new rows in UI
};

export type PrivateClass = {
  id: string;
  studentId?: string; // Not linked to general students anymore, can be optional
  studentName: string;
  classDate: string;
  numberOfClasses: number;
  pricePerClass: number;
  paymentAmount: number; // This will be the calculated total
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  paymentMethod: 'Pix' | 'Cartão' | 'Dinheiro' | 'Pendente';
  notes?: string;
  isNew?: boolean; // Flag for new rows in UI
};

export type Appointment = {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  classDate: string;
  classTime: string;
  notes?: string;
  isNew?: boolean; // Flag for new rows in UI
  enrolled?: boolean;
  attended?: boolean;
  missed?: boolean;
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
  isNew?: boolean; // Flag for new rows in UI
};

export type MonthlyIndicator = {
  id: string; // YYYY-MM
  year: number;
  month: number;
  previousMonthTotal?: number;
  visits?: number;
  trialClasses?: number;
  newEnrollments?: number;
  reenrollments?: number;
  exits?: number;
  womensMonth?: number;
  // Calculated fields (stored for convenience or calculated on the fly)
  totalStudents?: number;
  evolution?: number;
  conversionRate?: number;
};
    
