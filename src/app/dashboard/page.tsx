
"use client";

import { Overview } from "@/components/dashboard/overview";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { MonthlyPerformance } from "@/components/dashboard/monthly-performance";
import { PaymentSummary } from "@/components/dashboard/payment-summary";

export default function DashboardPage() {
  return (
    <>
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Painel</h1>
        </div>
        <div className="flex flex-1 rounded-lg" x-chunk="dashboard-02-chunk-1">
            <div className="flex flex-col w-full gap-4">
                <Overview />
                <MonthlyPerformance />
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <RevenueChart />
                    <PaymentSummary />
                </div>
            </div>
        </div>
    </>
  );
}
