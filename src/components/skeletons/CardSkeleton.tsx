// ═══════════════════════════════════════════════════════════════════
// Card Skeleton Loader Component
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardHeader, CardBody, Skeleton } from "@heroui/react";

interface CardSkeletonProps {
  lines?: number;
  showHeader?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  lines = 3,
  showHeader = true 
}) => {
  return (
    <Card className="shadow-lg">
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded" />
        </CardHeader>
      )}
      <CardBody className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => {
          const widthVariants = ["w-full", "w-5/6", "w-4/6", "w-3/6"];
          const width = widthVariants[index % widthVariants.length];
          
          return (
            <Skeleton key={`line-${index}`} className={`h-4 ${width} rounded`} />
          );
        })}
      </CardBody>
    </Card>
  );
};
