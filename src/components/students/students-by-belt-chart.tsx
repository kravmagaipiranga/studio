
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentsByBeltChartProps {
    students: Student[];
    isLoading: boolean;
}

const beltOrder = ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'];

const beltColors: Record<string, string> = {
    'Branca': '#f8f9fa',
    'Amarela': '#fcc419',
    'Laranja': '#fd7e14',
    'Verde': '#40c057',
    'Azul': '#228be6',
    'Marrom': '#8d6e63',
    'Preta': '#212529',
};


export function StudentsByBeltChart({ students, isLoading }: StudentsByBeltChartProps) {

    const data = useMemo(() => {
        const counts: Record<string, number> = {};

        students
            .filter(s => s.status === 'Ativo' && s.belt)
            .forEach(student => {
                const belt = student.belt;
                counts[belt] = (counts[belt] || 0) + 1;
            });
        
        return beltOrder
            .map(belt => ({
                name: belt,
                value: counts[belt] || 0,
                fill: beltColors[belt],
            }))
            .filter(item => item.value > 0);

    }, [students]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Alunos por Faixa</CardTitle>
                <CardDescription>Distribuição de alunos ativos por graduação.</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                             <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="name"
                                stroke="hsl(var(--foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={80}
                            />
                            <Tooltip 
                                cursor={{fill: 'hsl(var(--muted))'}}
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                <LabelList 
                                    dataKey="value" 
                                    position="right" 
                                    className="fill-foreground font-semibold"
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                        Nenhum aluno ativo encontrado.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


    
