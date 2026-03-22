import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Handle checkout session completion (hosted checkout approach)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const rawItems = session.metadata?.items;

    if (!userId || !rawItems) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Idempotency guard — Stripe retries webhooks on timeout/error,
    // so skip if we already created an order for this payment.
    const stripePaymentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;
    if (stripePaymentId) {
      const existing = await prisma.order.findFirst({
        where: { stripePaymentId },
      });
      if (existing) {
        return NextResponse.json({ received: true });
      }
    }

    const cartItems = JSON.parse(rawItems) as {
      productId: string;
      quantity: number;
    }[];

    // Fetch current DB prices (source of truth)
    const productIds = cartItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const orderItems = cartItems.map((item) => {
      const product = products.find((p: (typeof products)[number]) => p.id === item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const totalPrice = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await prisma.$transaction(async (tx: any) => {
        await tx.order.create({
          data: {
            userId,
            totalPrice,
            status: "PROCESSING",
            stripePaymentId,
            items: { create: orderItems },
          },
        });

        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      });
    } catch (err) {
      // P2002 = unique constraint violation — order already exists (race condition).
      // Return 200 so Stripe does not retry.
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        return NextResponse.json({ received: true });
      }
      throw err;
    }
  }

  return NextResponse.json({ received: true });
}
