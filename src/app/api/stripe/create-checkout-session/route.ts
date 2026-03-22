import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
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

    // Fetch real prices from DB
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

    // Validate stock and build Stripe line items
    const lineItems = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}"` },
          { status: 400 }
        );
      }
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            // Only pass images that are absolute https URLs (Stripe requirement)
            ...(product.imageUrl?.startsWith("https://")
              ? { images: [product.imageUrl] }
              : {}),
          },
          unit_amount: Math.round(product.price * 100), // cents
        },
        quantity: item.quantity,
      });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/orders?success=true`,
      cancel_url: `${origin}/checkout`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        items: JSON.stringify(
          items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        ),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[create-checkout-session]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
