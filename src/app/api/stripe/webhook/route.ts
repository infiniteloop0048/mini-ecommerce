import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      await tx.order.create({
        data: {
          userId,
          totalPrice,
          status: "PROCESSING",
          stripePaymentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
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
  }

  return NextResponse.json({ received: true });
}
