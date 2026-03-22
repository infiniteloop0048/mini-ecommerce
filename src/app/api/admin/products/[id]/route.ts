import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: parseFloat(data.price) }),
      ...(data.stock !== undefined && { stock: parseInt(data.stock) }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
    },
  });

  return NextResponse.json(product);
}
