import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeEvent = any;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      if (obj.mode !== "subscription") break;

      const userId = obj.metadata?.supabase_user_id;
      const planId = obj.metadata?.plan_id;
      const stripeSubId = typeof obj.subscription === "string" ? obj.subscription : obj.subscription?.id;
      const stripeCustomerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;

      if (!userId || !planId || !stripeSubId) break;

      const sub = await stripe.subscriptions.retrieve(stripeSubId) as StripeEvent;
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;

      await supabase.from("client_subscriptions").upsert({
        client_id: userId,
        plan_id: planId,
        stripe_subscription_id: stripeSubId,
        stripe_customer_id: stripeCustomerId,
        status: "active",
        current_period_end: periodEnd,
      }, { onConflict: "stripe_subscription_id" });
      break;
    }

    case "customer.subscription.updated": {
      const status = obj.status === "active" ? "active"
        : obj.status === "past_due" ? "past_due"
        : obj.status === "canceled" ? "canceled"
        : "paused";
      const periodEnd = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;

      await supabase
        .from("client_subscriptions")
        .update({ status, current_period_end: periodEnd })
        .eq("stripe_subscription_id", obj.id);
      break;
    }

    case "customer.subscription.deleted": {
      await supabase
        .from("client_subscriptions")
        .update({ status: "canceled" })
        .eq("stripe_subscription_id", obj.id);
      break;
    }

    case "invoice.payment_failed": {
      const subId = typeof obj.subscription === "string" ? obj.subscription : obj.subscription?.id;
      if (subId) {
        await supabase
          .from("client_subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const subId = typeof obj.subscription === "string" ? obj.subscription : obj.subscription?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId) as StripeEvent;
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        await supabase
          .from("client_subscriptions")
          .update({ status: "active", current_period_end: periodEnd })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
