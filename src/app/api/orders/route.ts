import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// Creates a Stripe Payment Intent and returns the clientSecret.
// The order is created in DB only after payment confirmation (via webhook).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body as {
    items: { productId: string; quantity: number }[];
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  // Fetch real prices from DB — never trust client-supplied prices
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products not found" },
      { status: 400 }
    );
  }

  // Validate stock and calculate server-side total
  const orderItems: { productId: string; quantity: number; price: number }[] = [];
  let totalPrice = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}"` },
        { status: 400 }
      );
    }
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    });
    totalPrice += product.price * item.quantity;
  }

  // Create Payment Intent — order row will be created by the webhook on success
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100), // convert to cents
    currency: "usd",
    metadata: {
      userId: session.user.id,
      items: JSON.stringify(orderItems),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    totalPrice,
  });
}
