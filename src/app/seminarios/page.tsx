
"use client";

import { useState } from "react";
import { SeminarsTable } from "@/components/seminars/seminars-table";
import { Button } from "@/components/ui/button";
import { Download, PlusCircle, Search } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { seminars as initialSeminars } from "@/lib/data";
import { Seminar } from "@/lib/types";

export default function SeminariosPage() {
    const [seminars, setSeminars] = useState<Seminar[]>(initialSeminars);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSeminars = seminars.filter(seminar =>
        seminar.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seminar.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-semibold md:text-2xl">Seminários e Cursos</h1>
                <div className="flex items-center gap-2">
                     <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nova Inscrição
                    </Button>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Relatório
                    </Button>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por aluno ou tema..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DatePickerWithRange />
            </div>
             <div className="flex flex-1 rounded-lg shadow-sm mt-4">
                <SeminarsTable 
                    seminars={filteredSeminars}
                />
            </div>
        </>
    );
}
