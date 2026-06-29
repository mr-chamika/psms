"use client";

import AdminOrdersPage from "@/app/(pages)/admin/orders/page";

interface OrdersListPageProps {
  basePath?: string;
}

export default function OrdersListPage({ basePath }: OrdersListPageProps) {
  void basePath;
  return <AdminOrdersPage />;
}
