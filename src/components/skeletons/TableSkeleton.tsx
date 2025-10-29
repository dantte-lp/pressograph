// ═══════════════════════════════════════════════════════════════════
// Table Skeleton Loader Component
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Skeleton } from "@heroui/react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showCard?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 6,
  showCard = true 
}) => {
  const tableContent = (
    <Table aria-label="Loading table">
      <TableHeader>
        {Array.from({ length: columns }).map((_, i) => (
          <TableColumn key={`header-${i}`}>
            <Skeleton className="h-4 w-24 rounded" />
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                <Skeleton className="h-4 w-full rounded" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (showCard) {
    return (
      <Card className="shadow-lg">
        <CardBody>
          {tableContent}
        </CardBody>
      </Card>
    );
  }

  return tableContent;
};
