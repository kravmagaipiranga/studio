
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export default function PagamentosPage() {
    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Gestão de Pagamentos</h1>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange />
                    <Button>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <PaymentsTable />
            </div>
        </>
    );
}
