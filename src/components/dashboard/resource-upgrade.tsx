"use client";

import Link from "next/link";
import { Cpu, MemoryStick, HardDrive, Globe, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  cpuCores: number | null;
  ramGb: number | null;
  storageGb: number | null;
  bandwidthTb: number | null;
  plan: string;
}

export function ResourceUpgrade({ cpuCores, ramGb, storageGb, bandwidthTb, plan }: Props) {
  if (plan !== "starter") return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Current Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <Cpu className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{cpuCores ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">vCPU</p>
          </div>
          <div className="text-center">
            <MemoryStick className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{ramGb ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">GB RAM</p>
          </div>
          <div className="text-center">
            <HardDrive className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{storageGb ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">GB SSD</p>
          </div>
          <div className="text-center">
            <Globe className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{bandwidthTb ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">TB BW</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/billing">
            Need more? View Upgrade Options
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
