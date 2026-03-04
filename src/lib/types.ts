
export type Student = {
  id: string;
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
  emergencyContacts: string;
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
  userId?: string;
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

export type WomensMonthLead = {
  id: string;
  name: string;
  whatsapp: string;
  chosenClass: string;
  hasCompanions: boolean;
  companionNames?: string;
  year: number;
  attended: boolean;
  createdAt: string;
  isNew?: boolean;
  isCompanion?: boolean;
  invitedBy?: string;
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

export type PrivateClass = {
  id: string;
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

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
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

export type GiftCardOrder = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCpf: string;
  recipientName: string;
  message?: string;
  paymentMethod: 'Pix' | 'Boleto';
  status: 'Pendente' | 'Pago' | 'Cancelado';
  createdAt: string;
  totalValue: number;
  validationCode: string;
};

export type Attendance = {
  id: string;
  studentId?: string;
  studentName: string;
  date: string;
  time: string;
  type: 'Semanal' | 'Sábado';
  category?: 'Aluno' | 'Visita' | 'Experiência';
  createdAt: string;
};

export type GlobalParameters = {
  id: 'global';
  schoolName: string;
  schoolCnpj: string;
  schoolAddress: string;
  schoolPhone: string;
  attendanceTargetPerWeek: number;
  beltRules: {
    branca: number;
    amarela: number;
    laranja: number;
    verde: number;
    azul: number;
    marrom: number;
  };
};

export type Company = {
  id: string;
  name: string;
  cnpj?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  workType: string; // Palestra, Curso, Workshop, Aula Particular, Outros
  value: number;
  paymentDate?: string;
  paymentMethod: 'Pix' | 'Boleto' | 'Dinheiro' | 'Pendente';
  paymentStatus: 'Pago' | 'Pendente';
  notes?: string;
  createdAt: string;
  isNew?: boolean;
};

export type MessageTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
};

export type HandbookContent = {
  id: string; // beltId
  beltName: string;
  content: string; // Raw text for editing
  techniques: string[]; // Individual techniques parsed from content
  updatedAt: string;
};
