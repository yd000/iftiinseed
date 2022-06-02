/* eslint-disable consistent-return */
import Stripe from 'stripe';
import {
  getSupabaseService,
  getUserProfile,
  getUserByAccessToken,
} from '../../../utils/supabase';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const supabase = getSupabaseService();
  const { user } = await getUserByAccessToken(supabase, req);
  if (!user) {
    return res
      .status(200)
      .json({ status: { type: 'failed', title: 'You are not signed in' } });
  }

  const profile = await getUserProfile(user, supabase);
  const setupIntent = await stripe.setupIntents.create({
    customer: profile.stripe_customer,
  });
  res.status(200).json({
    status: { type: 'succeeded' },
    client_secret: setupIntent.client_secret,
  });
}
