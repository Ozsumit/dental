"use server";

import prisma from "@/lib/prisma";
import { getTenantIdOrThrow } from "@/lib/auth/session";

export async function getReportData() {
  const tenantId = await getTenantIdOrThrow();

  const [inventory, totalPatients, totalRevenue] = await Promise.all([
    prisma.inventory.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.patient.count({ where: { tenantId } }),
    prisma.procedure.aggregate({
      where: { tenantId, status: "PAID" },
      _sum: { cost: true },
    }),
  ]);

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock).length;
  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  // Mock trend data for the chart since we don't have historical inventory snapshots
  const trendData = [
    { name: "Jan", stock: 400, value: 2400 },
    { name: "Feb", stock: 300, value: 1398 },
    { name: "Mar", stock: 200, value: 9800 },
    { name: "Apr", stock: 278, value: 3908 },
    { name: "May", stock: 189, value: 4800 },
    { name: "Jun", stock: 239, value: 3800 },
    { name: "Jul", stock: 349, value: 4300 },
  ];

  return {
    summary: {
      totalItems,
      lowStockItems,
      totalValue,
      totalPatients,
      totalRevenue: totalRevenue._sum.cost || 0,
    },
    inventory,
    trendData,
  };
}
