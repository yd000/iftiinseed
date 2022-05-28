/* eslint-disable consistent-return */
import { getSupabaseService, getUserProfile } from '../../../utils/supabase';

const notificationTypes = [
  'email_campaign_end',
  'email_campaign_end_soon',
  'email_campaign_deleted',
];

export default async function handler(req, res) {
  const sendError = (error) =>
    res.status(200).json({
      status: {
        type: 'failed',
        title: 'Failed to Update Notifications',
        ...error,
      },
    });

  const supabase = getSupabaseService();
  const { user } = await supabase.auth.api.getUserByCookie(req);
  if (!user) {
    return sendError({ title: 'You are not signed in' });
  }

  const profile = await getUserProfile(user, supabase);
  if (!profile) {
    return sendError({ title: 'profile not found' });
  }

  const notifications = notificationTypes.filter(
    (notificationType) => req.body[notificationType] === 'on'
  );
  await supabase.from('profile').update({ notifications }).eq('id', profile.id);

  res.status(200).json({
    status: {
      type: 'succeeded',
      title: 'Successfully Updated Notifications',
    },
  });
}