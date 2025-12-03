export type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'Basic' | 'Intermediate' | 'Advanced';
  registrationDate: string;
  status: 'Active' | 'Inactive' | 'Pending';
  paymentStatus: 'Paid' | 'Overdue' | 'Pending';
  dueDate?: string;
};

export type RevenueData = {
  month: string;
  revenue: number;
}
