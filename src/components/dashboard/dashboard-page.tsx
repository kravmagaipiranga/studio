
"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Overview } from "./overview";
import { RevenueChart } from "./revenue-chart";
import { DuePayments } from "./due-payments";

export default function DashboardPage() {
  return (
    <AppLayout>
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
        </div>
        <div className="flex flex-1 rounded-lg shadow-sm" x-chunk="dashboard-02-chunk-1">
            <div className="flex flex-col w-full gap-4">
                <Overview />
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <RevenueChart />
                    <DuePayments />
                </div>
            </div>
        </div>
    </AppLayout>
  );
}
