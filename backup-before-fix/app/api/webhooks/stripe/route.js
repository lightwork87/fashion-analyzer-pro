import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';
import { PLANS, CREDIT_PACKS } from '../../../lib/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  console.log('🔔 Webhook received at:', new Date().toISOString());
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  let event;
  
  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }
  
  console.log('✅ Webhook verified. Event type:', event.type);
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('💳 Payment successful for session:', session.id);
      
      try {
        // Get the full session details with line items
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ['line_items']
          }
        );
        
        const customerId = fullSession.customer;
        const customerEmail = fullSession.customer_email;
        const priceId = fullSession.line_items.data[0].price.id;
        
        console.log('📧 Customer email:', customerEmail);
        console.log('💰 Price ID:', priceId);
        
        // Find which plan or credit pack was purchased
        let creditsToAdd = 0;
        let planName = '';
        let isSubscription = false;
        
        // Check regular plans
        for (const [key, plan] of Object.entries(PLANS)) {
          if (plan.priceId === priceId) {
            creditsToAdd = plan.credits;
            planName = plan.name;
            isSubscription = plan.recurring || false;
            break;
          }
        }
        
        // Check credit packs if not a plan
        if (creditsToAdd === 0) {
          for (const [key, pack] of Object.entries(CREDIT_PACKS)) {
            if (pack.priceId === priceId) {
              creditsToAdd = pack.credits;
              planName = pack.name;
              isSubscription = false;
              break;
            }
          }
        }
        
        console.log(`📦 Product: ${planName}, Credits: ${creditsToAdd}, Subscription: ${isSubscription}`);
        
        if (creditsToAdd === 0) {
          console.error('❌ Unknown price ID:', priceId);
          return NextResponse.json(
            { error: 'Unknown product' },
            { status: 400 }
          );
        }
        
        // Find user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', customerEmail)
          .single();
        
        if (userError || !user) {
          console.error('❌ User not found:', customerEmail);
          return NextResponse.json(
            { error: 'User not found' },
            { status: 400 }
          );
        }
        
        console.log('👤 Found user:', user.id);
        
        // Update user with new credits and stripe customer ID
        if (isSubscription) {
          // For subscriptions, replace total credits and set status
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
              credits_total: creditsToAdd,
              credits_used: 0, // Reset used credits for new subscription
              subscription_status: 'active',
              subscription_plan: planName.toLowerCase().replace(' ', '_'),
              subscription_id: session.subscription,
              subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('❌ Error updating user:', updateError);
            throw updateError;
          }
          
          console.log(`✅ Subscription activated: ${planName} with ${creditsToAdd} credits`);
          
        } else {
          // For credit packs, add to total credits
          const newTotalCredits = user.credits_total + creditsToAdd;
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
              credits_total: newTotalCredits,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('❌ Error updating user credits:', updateError);
            throw updateError;
          }
          
          console.log(`✅ Credits added: ${creditsToAdd} (new total: ${newTotalCredits})`);
        }
        
        // Log the transaction
        const { error: logError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            stripe_payment_intent_id: session.payment_intent,
            stripe_session_id: session.id,
            amount: session.amount_total / 100, // Convert from cents
            currency: session.currency,
            credits_purchased: creditsToAdd,
            product_name: planName,
            status: 'completed',
            created_at: new Date().toISOString()
          });
        
        if (logError) {
          console.error('⚠️  Warning: Failed to log transaction:', logError);
          // Don't fail the webhook if logging fails
        }
        
        console.log('✅ Webhook processed successfully');
        
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json(
          { error: 'Webhook processing failed' },
          { status: 500 }
        );
      }
      break;
      
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      const subscription = event.data.object;
      console.log('🚫 Subscription cancelled:', subscription.id);
      
      try {
        // Find user by stripe customer ID
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', subscription.customer)
          .single();
        
        if (user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: 'cancelled',
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('❌ Error updating cancelled subscription:', updateError);
          } else {
            console.log('✅ Subscription cancelled for user:', user.id);
          }
        }
      } catch (error) {
        console.error('❌ Error handling subscription cancellation:', error);
      }
      break;
      
    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }
  
  return NextResponse.json({ received: true });
}