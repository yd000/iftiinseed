/* eslint-disable consistent-return */
import Stripe from 'stripe';
import {
  getSupabaseService,
  getUserProfile,
  paginationSize,
} from '../../../utils/supabase';
import sendEmail, { emailAdmin } from '../../../utils/send-email';
import { formatDollars } from '../../../utils/campaign-utils';

async function emailPledgers({ supabase, from, to, user }) {
  const { data: pledgesToEmail, error } = await supabase
    .from('pledge')
    .select('*, profile!inner(*), campaign!inner(*)', { count: 'exact' })
    .eq('campaign.created_by', user.id)
    .eq('campaign.processed', false)
    .eq('profile.notifications', ['email_campaign_deleted'])
    .range(from, to);

  console.log('pledgesToEmail', pledgesToEmail);

  if (!error) {
    await sendEmail(
      ...pledgesToEmail.map((pledge) => ({
        to: pledge.profile.email,
        subject: `A Campaign you pledged to was deleted`,
        dynamicTemplateData: {
          heading: `A Campaign you pledged to was deleted`,
          body: `A campaign trying to raise ${formatDollars(
            pledge.campaign.funding_goal,
            false
          )} for ${pledge.campaign.reason} was deleted.`,
        },
      }))
    );
  } else {
    console.error('error fetching campaigns', error);
  }
}

export default async function handler(req, res) {
  const supabase = getSupabaseService();
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  const { user } = await supabase.auth.api.getUserByCookie(req);
  if (!user) {
    return res
      .status(200)
      .json({ status: { type: 'failed', title: 'you are not signed in' } });
  }

  // FILL - can choose to get userId from query and delete that user instead
  console.log('user to delete', user);

  // email pledgers about deleted campaigns
  const {
    count: numberOfPledgesToEmail,
    error: getNumberOfPledgesToEmailError,
  } = await supabase
    .from('pledge')
    .select('*, profile!inner(*), campaign!inner(*)', { count: 'exact' })
    .eq('campaign.created_by', user.id)
    .eq('campaign.processed', false)
    .eq('profile.notifications', ['email_campaign_deleted']);

  console.log('numberOfPledgesToEmail', numberOfPledgesToEmail);
  console.log('getNumberOfPledgesToEmailError', getNumberOfPledgesToEmailError);
  if (!getNumberOfPledgesToEmailError) {
    if (numberOfPledgesToEmail > 0) {
      const emailPledgersPromises = [];
      for (
        let from = 0, to = paginationSize - 1;
        from < numberOfPledgesToEmail;
        from += paginationSize, to += paginationSize
      ) {
        const emailPledgersPromise = emailPledgers({
          supabase,
          from,
          to,
          user,
        });
        emailPledgersPromises.push(emailPledgersPromise);
      }
      await Promise.all(emailPledgersPromises);
    }
  }

  // delete campaigns
  const deleteCampaignsResult = await supabase
    .from('campaign')
    .delete()
    .eq('created_by', user.id);
  console.log('delete campaigns result', deleteCampaignsResult);

  // delete pledges
  const deletePledgesResult = await supabase
    .from('pledge')
    .delete()
    .eq('profile', user.id);
  console.log('delete pledges result', deletePledgesResult);

  // delete stripe customer/account
  const profile = await getUserProfile(user, supabase);
  await stripe.customers.del(profile.stripe_customer);
  await stripe.accounts.del(profile.stripe_account);

  // delete profile
  const deleteProfileResult = await supabase
    .from('profile')
    .delete()
    .eq('id', user.id);
  console.log('delete profile result', deleteProfileResult);

  const { error: deleteUserError } = await supabase.auth.api.deleteUser(
    user.id
  );
  console.log('delete user result', deleteUserError);

  await emailAdmin({
    subject: 'Deleted User',
    dynamicTemplateData: {
      heading: `Goodbye ${user.email}!`,
      body: `A user with email ${user.email} has deleted their account`,
    },
  });

  res.status(200).json({
    status: {
      type: 'succeeded',
      title: 'Deleted Account',
      message: 'Successfully deleted Account',
    },
  });
}
