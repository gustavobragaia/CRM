"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExamsBoardProvider } from "@/components/exams-board-provider";
import { PatientsDataProvider } from "./patients-provider";

export function PatientsTabsWrapper() {
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pacientes
          </h1>
        </div>
        <div>
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="outline">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="view-selector"
            >
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Ver por semestre</SelectItem>
              <SelectItem value="past-performance">Ver por tabela</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 hidden @4xl/main:flex">
            <TabsTrigger value="outline">Ver por semestre</TabsTrigger>
            <TabsTrigger value="past-performance">
              Ver por tabela <Badge variant="secondary">3</Badge>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        {/* Use the ExamsBoardProvider component that fetches real exam data */}
        <ExamsBoardProvider />
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="py-4">
          <PatientsDataProvider />
        </div>
      </TabsContent>
    </Tabs>
  );
}
