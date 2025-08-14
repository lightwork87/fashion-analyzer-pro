import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get the user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({
        shipping: [],
        payment: [],
        returns: [],
        error: 'User not found'
      });
    }

    // Get eBay tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('ebay_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokens) {
      console.log('No eBay tokens found');
      return NextResponse.json({
        shipping: [],
        payment: [],
        returns: [],
        error: 'eBay account not connected'
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    
    let accessToken = tokens.access_token;
    
    if (now >= expiresAt) {
      console.log('Token expired, refreshing...');
      // Refresh the token
      const refreshResult = await refreshEbayToken(tokens.refresh_token, user.id);
      if (refreshResult.error) {
        return NextResponse.json({
          shipping: [],
          payment: [],
          returns: [],
          error: 'Failed to refresh eBay token'
        });
      }
      accessToken = refreshResult.access_token;
    }

    // Fetch business policies from eBay
    console.log('Fetching business policies from eBay...');
    
    // Get Fulfillment (Shipping) Policies
    const shippingResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/fulfillment_policy',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Get Payment Policies
    const paymentResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/payment_policy',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Get Return Policies
    const returnResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/return_policy',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Parse responses
    const shippingData = shippingResponse.ok ? await shippingResponse.json() : { fulfillmentPolicies: [] };
    const paymentData = paymentResponse.ok ? await paymentResponse.json() : { paymentPolicies: [] };
    const returnData = returnResponse.ok ? await returnResponse.json() : { returnPolicies: [] };

    console.log('Policies fetched:', {
      shipping: shippingData.fulfillmentPolicies?.length || 0,
      payment: paymentData.paymentPolicies?.length || 0,
      returns: returnData.returnPolicies?.length || 0
    });

    // Format the policies for our frontend
    const formattedPolicies = {
      shipping: (shippingData.fulfillmentPolicies || []).map(policy => ({
        id: policy.fulfillmentPolicyId,
        name: policy.name,
        description: policy.description || '',
        handlingTime: policy.handlingTime?.value || 1,
        shippingOptions: (policy.shippingOptions || []).map(opt => ({
          service: opt.optionType,
          cost: opt.shippingCost?.value || '0',
          currency: opt.shippingCost?.currency || 'GBP'
        }))
      })),
      payment: (paymentData.paymentPolicies || []).map(policy => ({
        id: policy.paymentPolicyId,
        name: policy.name,
        description: policy.description || '',
        immediatePay: policy.immediatePay || false,
        methods: policy.paymentMethods?.map(m => m.paymentMethodType) || []
      })),
      returns: (returnData.returnPolicies || []).map(policy => ({
        id: policy.returnPolicyId,
        name: policy.name,
        description: policy.description || '',
        period: policy.returnPeriod?.value || 30,
        type: policy.returnsAccepted ? 'Returns Accepted' : 'No Returns',
        shippingCostPaidBy: policy.returnShippingCostPayer || 'BUYER'
      }))
    };

    return NextResponse.json(formattedPolicies);

  } catch (error) {
    console.error('Error fetching business policies:', error);
    return NextResponse.json({
      shipping: [],
      payment: [],
      returns: [],
      error: error.message
    });
  }
}

// Helper function to refresh eBay token
async function refreshEbayToken(refreshToken, userId) {
  try {
    const auth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Token refresh failed:', error);
      return { error: 'Failed to refresh token' };
    }

    const data = await response.json();

    // Update tokens in database
    const { error: updateError } = await supabase
      .from('ebay_tokens')
      .update({
        access_token: data.access_token,
        expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return { error: 'Failed to update tokens' };
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { error: error.message };
  }
}

// POST endpoint to create a new business policy
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, policy } = body; // type: 'shipping', 'payment', or 'returns'

    // Get user and tokens (similar to GET)
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    const { data: tokens } = await supabase
      .from('ebay_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (!tokens) {
      return NextResponse.json({ error: 'eBay not connected' }, { status: 400 });
    }

    // Map policy type to eBay API endpoint
    const endpoints = {
      shipping: 'fulfillment_policy',
      payment: 'payment_policy',
      returns: 'return_policy'
    };

    const endpoint = endpoints[type];
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid policy type' }, { status: 400 });
    }

    // Create policy on eBay
    const response = await fetch(
      `https://api.ebay.com/sell/account/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(policy)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create policy:', error);
      return NextResponse.json(
        { error: 'Failed to create policy on eBay' },
        { status: response.status }
      );
    }

    const createdPolicy = await response.json();
    return NextResponse.json(createdPolicy);

  } catch (error) {
    console.error('Create policy error:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}