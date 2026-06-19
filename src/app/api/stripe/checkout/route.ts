import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { planId } = await request.json();
  if (!planId) {
    return NextResponse.json({ error: "planId obrigatório" }, { status: 400 });
  }

  // Load plan
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .eq("active", true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  // Load or create Stripe product/price if needed
  let stripePriceId = plan.stripe_price_id;
  if (!stripePriceId) {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description || undefined,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(plan.price * 100),
      currency: "brl",
      recurring: { interval: "month" },
    });
    stripePriceId = price.id;
    await supabase
      .from("subscription_plans")
      .update({ stripe_price_id: price.id, stripe_product_id: product.id })
      .eq("id", planId);
  }

  // Get or create Stripe customer
  let { data: clientProfile } = await supabase
    .from("clients")
    .select("*")
    .eq("id", user.id)
    .single();

  let stripeCustomerId = clientProfile?.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: clientProfile?.name || user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await supabase
      .from("clients")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", user.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${siteUrl}/conta?assinatura=sucesso`,
    cancel_url: `${siteUrl}/planos`,
    metadata: {
      supabase_user_id: user.id,
      plan_id: planId,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
    },
    locale: "pt-BR",
  });

  return NextResponse.json({ url: session.url });
}
