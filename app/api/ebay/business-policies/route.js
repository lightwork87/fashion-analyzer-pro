import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching business policies for user:', userId);

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

    console.log('Fetching business policies from eBay...');
    
    // Try different API endpoints based on eBay documentation
    // First try the Business Policies Management API
    const policiesResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/privilege',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Privileges response status:', policiesResponse.status);
    
    if (policiesResponse.ok) {
      const privilegesData = await policiesResponse.json();
      console.log('User privileges:', privilegesData);
    }

    // Get Fulfillment (Shipping) Policies - Updated endpoint
    const shippingResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_GB',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Shipping policies response status:', shippingResponse.status);
    
    // Log the raw response for debugging
    const shippingText = await shippingResponse.text();
    console.log('Shipping response raw:', shippingText.substring(0, 500));
    
    let shippingData = { fulfillmentPolicies: [] };
    try {
      shippingData = shippingText ? JSON.parse(shippingText) : { fulfillmentPolicies: [] };
    } catch (e) {
      console.error('Failed to parse shipping response:', e);
    }

    // Get Payment Policies
    const paymentResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_GB',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Payment policies response status:', paymentResponse.status);
    
    const paymentText = await paymentResponse.text();
    console.log('Payment response raw:', paymentText.substring(0, 500));
    
    let paymentData = { paymentPolicies: [] };
    try {
      paymentData = paymentText ? JSON.parse(paymentText) : { paymentPolicies: [] };
    } catch (e) {
      console.error('Failed to parse payment response:', e);
    }

    // Get Return Policies
    const returnResponse = await fetch(
      'https://api.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_GB',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Return policies response status:', returnResponse.status);
    
    const returnText = await returnResponse.text();
    console.log('Return response raw:', returnText.substring(0, 500));
    
    let returnData = { returnPolicies: [] };
    try {
      returnData = returnText ? JSON.parse(returnText) : { returnPolicies: [] };
    } catch (e) {
      console.error('Failed to parse return response:', e);
    }

    console.log('Policies found:', {
      shipping: shippingData.fulfillmentPolicies?.length || 0,
      payment: paymentData.paymentPolicies?.length || 0,
      returns: returnData.returnPolicies?.length || 0
    });

    // Check if we have the correct response structure
    console.log('Shipping data structure:', Object.keys(shippingData));
    console.log('Payment data structure:', Object.keys(paymentData));
    console.log('Return data structure:', Object.keys(returnData));

    // Format the policies for our frontend - Updated to handle different response structures
    const formattedPolicies = {
      shipping: Array.isArray(shippingData.fulfillmentPolicies) ? 
        shippingData.fulfillmentPolicies.map(policy => ({
          id: policy.fulfillmentPolicyId,
          name: policy.name,
          description: policy.description || '',
          handlingTime: policy.handlingTime?.value || 1,
          shippingOptions: (policy.shippingOptions || []).map(opt => ({
            service: opt.shippingService?.shippingServiceCode || opt.optionType || 'Standard',
            cost: opt.shippingCost?.value || '0',
            currency: opt.shippingCost?.currency || 'GBP'
          }))
        })) : [],
      payment: Array.isArray(paymentData.paymentPolicies) ? 
        paymentData.paymentPolicies.map(policy => ({
          id: policy.paymentPolicyId,
          name: policy.name,
          description: policy.description || '',
          immediatePay: policy.immediatePay || false,
          methods: policy.paymentMethods?.map(m => m.paymentMethodType || m.brands?.[0] || 'Unknown') || []
        })) : [],
      returns: Array.isArray(returnData.returnPolicies) ? 
        returnData.returnPolicies.map(policy => ({
          id: policy.returnPolicyId,
          name: policy.name,
          description: policy.description || '',
          period: policy.returnPeriod?.value || 30,
          type: policy.returnsAccepted ? 'Returns Accepted' : 'No Returns',
          shippingCostPaidBy: policy.returnShippingCostPayer || 'BUYER'
        })) : []
    };

    // If no policies found, add debug info
    if (formattedPolicies.shipping.length === 0 && 
        formattedPolicies.payment.length === 0 && 
        formattedPolicies.returns.length === 0) {
      console.log('No policies found. Debug info:', {
        shippingResponse: shippingResponse.status,
        paymentResponse: paymentResponse.status,
        returnResponse: returnResponse.status,
        shippingData: shippingData,
        paymentData: paymentData,
        returnData: returnData
      });
      
      formattedPolicies.debug = {
        message: 'No policies found. Check console logs.',
        shippingStatus: shippingResponse.status,
        paymentStatus: paymentResponse.status,
        returnStatus: returnResponse.status
      };
    }

    return NextResponse.json(formattedPolicies);

  } catch (error) {
    console.error('Error fetching business policies:', error);
    return NextResponse.json({
      shipping: [],
      payment: [],
      returns: [],
      error: error.message,
      debug: {
        stack: error.stack,
        message: error.message
      }
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
        refresh_token: refreshToken,
        scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.inventory'
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