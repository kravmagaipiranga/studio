
export type Student = {
  id: string;
  userId?: string;
  name: string;
  email: string;
  registrationDate: string;
  status: 'Ativo' | 'Inativo' | 'Pendente';
  paymentStatus: 'Pago' | 'Vencido' | 'Pendente';
  dueDate?: string;
  dob: string;
  cpf: string;
  tshirtSize: string;
  pantsSize: string;
  phone: string;
  emergencyContacts?: string;
  startDate?: string;
  lastExamDate?: string;
  belt: string;
  medicalHistory?: string;
  generalNotes?: string;
  fikmAnnuityPaid?: boolean;
  fikmAnnuityPaymentDate?: string;
  fikmAnnuityPaymentMethod?: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  readyForReview?: boolean;
  planType?: 'Mensal' | 'Trimestral' | 'Bolsa 50%' | 'Bolsa 100%' | 'Outros' | 'Matrícula';
  planValue?: number;
  paymentPreference?: ('pix' | 'dinheiro' | 'boleto')[];
  lastPaymentDate?: string;
  planExpirationDate?: string;
  paymentCredits?: string;
};

export type GiftCardOrder = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCpf: string;
  recipientName: string;
  message?: string;
  paymentMethod: 'Pix' | 'Boleto';
  status: 'Pendente' | 'Pago';
  createdAt: string;
  totalValue: number;
};

export type Payment = {
  id: string;
  studentId: string;
  studentName: string;
  paymentDate: string;
  planType: 'Mensal' | 'Trimestral' | 'Bolsa 50%' | 'Bolsa 100%' | 'Outros' | 'Matrícula';
  amount: number;
  expirationDate?: string;
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  notes?: string;
};

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
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  isNew?: boolean;
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
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  isNew?: boolean;
};

export type PrivateClass = {
  id: string;
  studentId?: string;
  studentName: string;
  classDate: string;
  classTime: string;
  numberOfClasses: number;
  pricePerClass: number;
  paymentAmount: number;
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  notes?: string;
  isNew?: boolean;
};

export type Appointment = {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  classDate: string;
  classTime: string;
  notes?: string;
  isNew?: boolean;
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
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  paymentStatus: 'Pago' | 'Pendente';
  isNew?: boolean;
};

export type MonthlyIndicator = {
  id: string;
  year: number;
  month: number;
  previousMonthTotal?: number;
  visits?: number;
  trialClasses?: number;
  newEnrollments?: number;
  reenrollments?: number;
  exits?: number;
  womensMonth?: number;
  totalStudents?: number;
  evolution?: number;
  conversionRate?: number;
};

export type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: any;
};

export type OrderItem = {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
};

export type UniformOrder = {
  id: string;
  studentId: string;
  studentName: string;
  orderDate: string;
  items: OrderItem[];
  totalValue: number;
  paymentStatus: 'Pago' | 'Pendente';
  paymentDate?: string;
  materialPickedUp: boolean;
  isNew?: boolean;
};

export type Lead = {
  id: string;
  contactDate: string;
  name: string;
  phone: string;
  contacted: boolean;
  responded?: boolean;
  isNew?: boolean;
};
