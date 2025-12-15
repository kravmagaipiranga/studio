
'use client';

import { useMemo } from 'react';
import { Funnel, FunnelChart, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
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
            .filter(item => item.value > 0)
            .reverse(); // Reverse the array to have lower belts at the base

    }, [students]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[100px] w-full" />
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
                    <ResponsiveContainer width="100%" height={100}>
                        <FunnelChart layout="horizontal">
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                            />
                            <Funnel
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                lastShapeType="rectangle"
                            >
                                <LabelList 
                                    position="center" 
                                    fill="#fff" 
                                    stroke="hsl(var(--foreground))"
                                    strokeWidth={0.5}
                                    dataKey="name" 
                                    className="text-xs font-semibold"
                                    formatter={(label: string) => {
                                        const count = data.find(d => d.name === label)?.value;
                                        // A bit of a hack to make black belt label readable
                                        if (label === 'Preta' && count && count > 0) return ''; 
                                        return label;
                                    }}
                                />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
                        Nenhum aluno ativo encontrado.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


    
