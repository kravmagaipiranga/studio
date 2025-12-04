'use client';
import { redirect } from 'next/navigation';

export default function NewSaleRedirectPage() {
    redirect('/vendas/novo/editar');
}
