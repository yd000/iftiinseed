/* eslint-disable no-param-reassign */
import { useEffect, useState } from 'react';
import { QrcodeIcon } from '@heroicons/react/outline';
import MyLink from '../MyLink';
import { supabase } from '../../utils/supabase';
import {
  getMaximumPossibleNumberOfPledgers,
  getPledgeDollars,
  getPledgeDollarsPlusFees,
  formatDollars,
  defaultLocale,
} from '../../utils/campaign-utils';
import { useUser } from '../../context/user-context';
import DeleteCampaignModal from './DeleteCampaignModal';
import Notification from '../Notification';

import PledgeModal from './PledgeModal';

import RemovePledgeModal from './RemovePledgeModal';

import QRCodeModal from './QRCodeModal';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const capitalizeString = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

export default function Campaign({ campaignId, setCampaignReason }) {
  const [isGettingCampaign, setIsGettingCampaign] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const { user, isAdmin, paymentMethodsObject, getPaymentMethod } = useUser();

  const [isMyCampaign, setIsMyCampaign] = useState(null);
  useEffect(() => {
    if (user && campaign) {
      setIsMyCampaign(user.id === campaign.created_by);
    }
  }, [user, campaign]);

  const getCampaign = async () => {
    // eslint-disable-next-line no-shadow
    const { data: campaign } = await supabase
      .from('campaign')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();
    console.log('setting campaign', campaign);
    if (campaign) {
      setCampaignReason(campaign.reason);
    }
    setCampaign(campaign);
    setIsGettingCampaign(false);
  };
  useEffect(() => {
    if (campaignId) {
      getCampaign();
    }
  }, [campaignId]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (campaign) {
      console.log('subscribing to campaign updates');
      const subscription = supabase
        .from(`campaign:id=eq.${campaign.id}`)
        .on('UPDATE', (payload) => {
          console.log('updated campaign');
          setCampaign({ ...campaign, ...payload.new });
        })
        .on('DELETE', (payload) => {
          console.log('deleted campaign', payload);
          setCampaign(null);
        })
        .subscribe();
      return () => {
        console.log('unsubscribing to campaign updates');
        supabase.removeSubscription(subscription);
      };
    }
  }, [campaign]);

  const [pledge, setPledge] = useState(null);
  const [didGetPledge, setDidGetPledge] = useState(false);
  const [isGettingPledge, setIsGettingPledge] = useState(true);
  const getPledge = async () => {
    console.log('fetching pledge');
    // eslint-disable-next-line no-shadow
    const { data: pledge } = await supabase
      .from('pledge')
      .select('*')
      .match({ profile: user.id, campaign: campaignId })
      .maybeSingle();
    console.log('setting pledge', pledge);
    setPledge(pledge);
    setIsGettingPledge(false);
    setDidGetPledge(true);
  };
  useEffect(() => {
    if (
      campaign &&
      user &&
      isMyCampaign === false &&
      !pledge &&
      !didGetPledge
    ) {
      getPledge();
    }
  }, [campaign, user, isMyCampaign, pledge, didGetPledge]);

  const [paymentMethod, setPaymentMethod] = useState(null);
  useEffect(() => {
    if (pledge) {
      if (paymentMethodsObject[pledge.payment_method]) {
        setPaymentMethod(paymentMethodsObject[pledge.payment_method]);
      } else {
        getPaymentMethod(pledge.payment_method);
      }
    }
  }, [pledge, paymentMethodsObject]);

  useEffect(() => {
    console.log('paymentMethod', paymentMethod);
  }, [paymentMethod]);

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (isMyCampaign === false) {
      console.log('subscribing to pledge updates');
      const subscription = supabase
        .from(`pledge:campaign=eq.${campaignId}`)
        .on('INSERT', (payload) => {
          console.log('inserted pledge', payload);
          setPledge(payload.new);
        })
        .on('UPDATE', (payload) => {
          console.log('updated pledge');
          setPledge({ ...pledge, ...payload.new });
        })
        .on('DELETE', (payload) => {
          console.log('deleted pledge', payload);
          setPledge(null);
        })
        .subscribe();
      return () => {
        console.log('unsubscribing to pledge updates');
        supabase.removeSubscription(subscription);
      };
    }
  }, [isMyCampaign]);

  const [
    hypotheticalFinalNumberOfPledgers,
    setHypotheticalFinalNumberOfPledgers,
  ] = useState(0);
  const [
    isHypotheticalFinalNumberOfPledgersEmptyString,
    setIsHypotheticalFinalNumberOfPledgersEmptyString,
  ] = useState(false);
  useEffect(() => {
    if (campaign) {
      setHypotheticalFinalNumberOfPledgers(campaign.minimum_number_of_pledgers);
    }
  }, [campaign]);
  const [maximumPossibleNumberOfPledgers, setMaximumPossibleNumberOfPledgers] =
    useState(Infinity);
  useEffect(() => {
    if (campaign) {
      setMaximumPossibleNumberOfPledgers(
        getMaximumPossibleNumberOfPledgers(campaign.funding_goal)
      );
    }
  }, [campaign]);

  const [
    isCampaignHypotheticallySuccessful,
    setIsCampaignHypotheticallySuccessful,
  ] = useState(false);
  useEffect(() => {
    if (campaign) {
      setIsCampaignHypotheticallySuccessful(
        hypotheticalFinalNumberOfPledgers >= campaign.minimum_number_of_pledgers
      );
    }
  }, [campaign, hypotheticalFinalNumberOfPledgers]);

  const [deadline, setDeadline] = useState('');
  useEffect(() => {
    if (campaign) {
      setDeadline(new Date(campaign.deadline));
    }
  }, [campaign]);

  const [createdDate, setCreatedDate] = useState('');
  useEffect(() => {
    if (campaign) {
      setCreatedDate(new Date(campaign.created_at));
    }
  }, [campaign]);

  const [isCampaignSuccessful, setIsCampaignSuccessful] = useState(false);
  useEffect(() => {
    if (campaign) {
      setIsCampaignSuccessful(
        campaign.number_of_pledgers >= campaign.minimum_number_of_pledgers
      );
    }
  }, [campaign]);

  const [minimumPledgeDollarsPlusFees, setMinimumPledgeDollarsPlusFees] =
    useState(0);
  useEffect(() => {
    if (campaign) {
      setMinimumPledgeDollarsPlusFees(
        getPledgeDollarsPlusFees(
          campaign.funding_goal,
          campaign.minimum_number_of_pledgers
        )
      );
    }
  }, [campaign]);

  const [minimumPledgeDollars, setMinimumPledgeDollars] = useState(0);
  useEffect(() => {
    if (campaign) {
      setMinimumPledgeDollars(
        getPledgeDollars(
          campaign.funding_goal,
          campaign.minimum_number_of_pledgers
        )
      );
    }
  }, [campaign]);

  const [maximumPledgeDollarsPlusFees, setMaximumPledgeDollarsPlusFees] =
    useState(0);
  useEffect(() => {
    if (campaign) {
      setMaximumPledgeDollarsPlusFees(
        getPledgeDollarsPlusFees(
          campaign.funding_goal,
          maximumPossibleNumberOfPledgers
        )
      );
    }
  }, [campaign, maximumPossibleNumberOfPledgers]);

  const [maximumPledgeDollars, setMaximumPledgeDollars] = useState(0);
  useEffect(() => {
    if (campaign) {
      setMaximumPledgeDollars(
        getPledgeDollars(campaign.funding_goal, maximumPossibleNumberOfPledgers)
      );
    }
  }, [campaign, maximumPossibleNumberOfPledgers]);

  const [currentPledgeDollarsPlusFees, setCurrentPledgeDollarsPlusFees] =
    useState(0);
  useEffect(() => {
    if (campaign && (campaign.succeeded || isCampaignSuccessful)) {
      setCurrentPledgeDollarsPlusFees(
        getPledgeDollarsPlusFees(
          campaign.funding_goal,
          campaign.number_of_pledgers
        )
      );
    }
  }, [campaign, isCampaignSuccessful]);

  const [currentPledgeDollars, setCurrentPledgeDollars] = useState(0);
  useEffect(() => {
    if (campaign && (campaign.succeeded || isCampaignSuccessful)) {
      setCurrentPledgeDollars(
        getPledgeDollars(campaign.funding_goal, campaign.number_of_pledgers)
      );
    }
  }, [campaign, isCampaignSuccessful]);

  const [
    hypotheticalPledgeDollarsPlusFees,
    setHypotheticalPledgeDollarsPlusFees,
  ] = useState(0);
  useEffect(() => {
    if (campaign && isCampaignHypotheticallySuccessful) {
      setHypotheticalPledgeDollarsPlusFees(
        getPledgeDollarsPlusFees(
          campaign.funding_goal,
          hypotheticalFinalNumberOfPledgers
        )
      );
    }
  }, [
    campaign,
    isCampaignHypotheticallySuccessful,
    hypotheticalFinalNumberOfPledgers,
  ]);

  const [hypotheticalPledgeDollars, setHypotheticalPledgeDollars] = useState(0);
  useEffect(() => {
    if (campaign && isCampaignHypotheticallySuccessful) {
      setHypotheticalPledgeDollars(
        getPledgeDollars(
          campaign.funding_goal,
          hypotheticalFinalNumberOfPledgers
        )
      );
    }
  }, [
    campaign,
    isCampaignHypotheticallySuccessful,
    hypotheticalFinalNumberOfPledgers,
  ]);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  useEffect(() => {
    if (campaign) {
      setSelectedCampaign(campaign);
    }
  }, [campaign]);

  const [showDeleteCampaignModal, setShowDeleteCampaignModal] = useState(false);
  const [deleteCampaignStatus, setDeleteCampaignStatus] = useState();
  const [showDeleteCampaignNotification, setShowDeleteCampaignNotification] =
    useState(false);

  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [pledgeStatus, setPledgeStatus] = useState();
  const [showPledgeNotification, setShowPledgeNotification] = useState(false);

  const [showRemovePledgeModal, setShowRemovePledgeModal] = useState(false);
  const [removePledgeStatus, setRemovePledgeStatus] = useState();
  const [showRemovePledgeNotification, setShowRemovePledgeNotification] =
    useState(false);

  const removeNotifications = () => {
    setShowPledgeNotification(false);
    setShowRemovePledgeNotification(false);
    setShowDeleteCampaignNotification(false);
  };
  useEffect(() => {
    if (showPledgeModal || showRemovePledgeModal || showDeleteCampaignModal) {
      removeNotifications();
    }
  }, [showPledgeModal, showRemovePledgeModal, showDeleteCampaignModal]);

  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  return (
    <>
      <DeleteCampaignModal
        open={showDeleteCampaignModal}
        setOpen={setShowDeleteCampaignModal}
        selectedCampaign={selectedCampaign}
        setDeleteCampaignStatus={setDeleteCampaignStatus}
        setShowDeleteCampaignNotification={setShowDeleteCampaignNotification}
      />
      <Notification
        open={showDeleteCampaignNotification}
        setOpen={setShowDeleteCampaignNotification}
        status={deleteCampaignStatus}
      />

      <PledgeModal
        open={showPledgeModal}
        setOpen={setShowPledgeModal}
        selectedCampaign={selectedCampaign}
        setPledgeStatus={setPledgeStatus}
        setShowPledgeNotification={setShowPledgeNotification}
        pledge={pledge}
        setPledge={setPledge}
      />
      <Notification
        open={showPledgeNotification}
        setOpen={setShowPledgeNotification}
        status={pledgeStatus}
      />

      <RemovePledgeModal
        open={showRemovePledgeModal}
        setOpen={setShowRemovePledgeModal}
        selectedCampaign={selectedCampaign}
        setRemovePledgeStatus={setRemovePledgeStatus}
        setShowRemovePledgeNotification={setShowRemovePledgeNotification}
      />
      <Notification
        open={showRemovePledgeNotification}
        setOpen={setShowRemovePledgeNotification}
        status={removePledgeStatus}
      />

      <QRCodeModal
        open={showQRCodeModal}
        setOpen={setShowQRCodeModal}
        campaign={campaign}
      />

      <div className="style-links mx-auto max-w-prose bg-white text-lg shadow sm:rounded-lg">
        <div className="py-3 px-5 pb-5 sm:py-4 sm:pb-5">
          {isGettingCampaign && (
            <div className="style-links prose prose-lg mx-auto text-center text-xl text-gray-500">
              <p>Loading campaign...</p>
            </div>
          )}

          {!isGettingCampaign &&
            (campaign ? (
              <>
                <div className="mx-auto max-w-prose text-lg">
                  <h1>
                    <span className="mt-2 block text-center text-2xl font-bold leading-8 tracking-tight text-gray-900 sm:text-3xl">
                      I am raising{' '}
                      <span>{formatDollars(campaign.funding_goal, false)}</span>{' '}
                      for <span>{campaign.reason}</span>.
                    </span>
                  </h1>
                </div>
                <div className="mx-auto max-w-prose text-lg">
                  <div className="prose prose-lg prose-yellow mx-auto mt-4 text-xl text-gray-500">
                    <p>
                      This campaign requires a minimum of{' '}
                      <span className="font-bold ">
                        {campaign.minimum_number_of_pledgers.toLocaleString(
                          defaultLocale
                        )}
                      </span>{' '}
                      {campaign.minimum_number_of_pledgers === 1
                        ? 'pledger'
                        : 'pledgers'}{' '}
                      by{' '}
                      <span className="font-bold">
                        {deadline && deadline.toLocaleString()}
                      </span>
                      , where each pledger will pay at most{' '}
                      <span className="font-bold text-green-500">
                        {formatDollars(minimumPledgeDollars)}
                      </span>{' '}
                      (
                      <span className="text-green-500">
                        {formatDollars(minimumPledgeDollarsPlusFees)}
                      </span>{' '}
                      after fees). If fewer people pledge by the deadline then
                      no charges will be made.
                    </p>
                    <p>
                      There is also a maximum of{' '}
                      <span className="font-bold">
                        {maximumPossibleNumberOfPledgers.toLocaleString()}
                      </span>{' '}
                      pledgers, where each pledger would pay only{' '}
                      <span className="font-bold text-green-500">
                        {formatDollars(maximumPledgeDollars)}
                      </span>{' '}
                      (
                      <span className="text-green-500">
                        {formatDollars(maximumPledgeDollarsPlusFees)}
                      </span>{' '}
                      after fees).
                    </p>

                    {campaign.processed ? (
                      <p>
                        This campaign{' '}
                        <span
                          className={classNames(
                            'font-medium',
                            campaign.succeeded
                              ? 'text-green-500'
                              : 'text-red-500'
                          )}
                        >
                          {campaign.succeeded ? 'succeeded' : 'failed'}
                        </span>{' '}
                        with{' '}
                        <span className="font-bold">
                          {campaign.number_of_pledgers.toLocaleString()}/
                          {campaign.minimum_number_of_pledgers.toLocaleString()}
                        </span>{' '}
                        pledgers, and{' '}
                        {campaign.succeeded ? (
                          <>
                            each pledger paid{' '}
                            <span className="font-bold text-green-500">
                              {formatDollars(currentPledgeDollars)}
                            </span>{' '}
                            (
                            <span className="text-green-500">
                              {formatDollars(currentPledgeDollarsPlusFees)}
                            </span>{' '}
                            after fees)
                          </>
                        ) : (
                          <>nothing happened</>
                        )}
                        .
                      </p>
                    ) : (
                      <>
                        <p>
                          There{' '}
                          {campaign.number_of_pledgers === 1 ? 'is' : 'are'}{' '}
                          currently{' '}
                          <span className="font-bold">
                            {campaign.number_of_pledgers.toLocaleString()}/
                            {campaign.minimum_number_of_pledgers.toLocaleString()}
                          </span>{' '}
                          pledgers, so when the deadline passes{' '}
                          {isCampaignSuccessful ? (
                            <>
                              each pledger will pay{' '}
                              <span className="font-bold text-green-500">
                                {formatDollars(currentPledgeDollars)}
                              </span>{' '}
                              (
                              <span className="text-green-500">
                                {formatDollars(currentPledgeDollarsPlusFees)}
                              </span>{' '}
                              after fees)
                            </>
                          ) : (
                            <>nothing will happen</>
                          )}
                          .
                        </p>
                        <p>
                          If there{' '}
                          {hypotheticalFinalNumberOfPledgers === 1
                            ? 'is'
                            : 'are'}{' '}
                          <input
                            required
                            type="number"
                            inputMode="numeric"
                            name="hypotheticalFinalNumberOfPledgers"
                            id="hypotheticalFinalNumberOfPledgers"
                            step="1"
                            value={
                              isHypotheticalFinalNumberOfPledgersEmptyString
                                ? ''
                                : hypotheticalFinalNumberOfPledgers
                            }
                            min={0}
                            max={maximumPossibleNumberOfPledgers}
                            placeholder={hypotheticalFinalNumberOfPledgers}
                            onInput={(e) => {
                              setIsHypotheticalFinalNumberOfPledgersEmptyString(
                                e.target.value === ''
                              );
                              setHypotheticalFinalNumberOfPledgers(
                                Number(e.target.value)
                              );
                            }}
                            className="inline-block rounded-md border-gray-300 px-0 py-0 pl-1 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                          />{' '}
                          {hypotheticalFinalNumberOfPledgers === 1
                            ? 'pledger'
                            : 'pledgers'}{' '}
                          when the deadline passes, then the campaign{' '}
                          <span
                            className={classNames(
                              'font-medium',
                              isCampaignHypotheticallySuccessful
                                ? 'text-green-500'
                                : 'text-red-500'
                            )}
                          >
                            {isCampaignHypotheticallySuccessful
                              ? 'succeeds'
                              : 'fails'}
                          </span>
                          , and{' '}
                          {isCampaignHypotheticallySuccessful ? (
                            <>
                              each pledger pays{' '}
                              <span className="font-bold text-green-500">
                                {formatDollars(hypotheticalPledgeDollars)}
                              </span>{' '}
                              (
                              <span className="text-green-500">
                                {formatDollars(
                                  hypotheticalPledgeDollarsPlusFees
                                )}
                              </span>{' '}
                              after fees)
                            </>
                          ) : (
                            <>nothing happens</>
                          )}
                          .
                        </p>
                      </>
                    )}
                    <p className="italic">
                      This campaign was created on{' '}
                      <span className="font-bold">
                        {createdDate && createdDate.toLocaleString()}
                      </span>
                    </p>
                    {campaign.processed ? (
                      !campaign.approved && (
                        <p className="italic">
                          This campaign was not approved.
                        </p>
                      )
                    ) : (
                      <p className="italic">
                        This campaign has {campaign.approved && 'been '}
                        <span className="font-bold">
                          {campaign.approved
                            ? 'approved by Pennyseed'
                            : 'not been approved by Pennyseed yet'}
                        </span>
                        {!campaign.approved && (
                          <>, but you can still pledge in the meantime</>
                        )}
                        .
                      </p>
                    )}

                    {user &&
                      !isMyCampaign &&
                      !isGettingPledge &&
                      !campaign.processed &&
                      campaign.number_of_pledgers <
                        maximumPossibleNumberOfPledgers &&
                      !pledge && (
                        <p className="italic">
                          Make sure you received this campaign link from a
                          trusted source before pledging.
                        </p>
                      )}

                    {pledge && paymentMethod && campaign.succeeded && (
                      <p className="italic">
                        You pledged to this campaign using your{' '}
                        <span className="font-bold">
                          {capitalizeString(paymentMethod.card.brand)} ending in{' '}
                          {paymentMethod.card.last4}
                        </span>
                        .
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="style-links prose prose-lg mx-auto text-center text-xl text-gray-500">
                <p>Campaign not found.</p>
              </div>
            ))}
        </div>
        {campaign && (
          <div className="mt-1 flex items-end justify-end gap-2 bg-gray-50 px-4 py-3 text-right text-xs sm:px-6 sm:text-sm">
            <button
              type="button"
              onClick={() => {
                setShowQRCodeModal(true);
              }}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-1 px-1 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              <span className="sr-only">QR Code</span>
              <QrcodeIcon className="h-7 w-7" aria-hidden="true" />
            </button>
            {navigator.canShare && (
              <button
                type="button"
                onClick={() => {
                  navigator.share({
                    title: `Pennyseed Campaign`,
                    text: `Help raise ${formatDollars(
                      campaign.funding_goal,
                      false
                    )} for ${campaign.reason}!`,
                    url: `https://pennyseed.me/${campaign.id}`,
                  });
                }}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Share
              </button>
            )}
            {user &&
              !isMyCampaign &&
              !isGettingPledge &&
              !campaign.processed &&
              campaign.number_of_pledgers < maximumPossibleNumberOfPledgers &&
              (pledge ? (
                <button
                  type="button"
                  onClick={() => setShowRemovePledgeModal(true)}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Unpledge
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPledgeModal(true)}
                  className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 py-2 px-4 font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  Pledge
                </button>
              ))}
            {isAdmin && !campaign.processed && (
              <button
                type="button"
                onClick={async () => {
                  const updateCampaignResult = await supabase
                    .from('campaign')
                    .update({ approved: !campaign.approved })
                    .eq('id', campaign.id);
                  console.log('updateCampaignResult', updateCampaignResult);
                }}
                className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 py-2 px-4 font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                {campaign.approved ? 'Deny' : 'Approve'}
              </button>
            )}
            {(isMyCampaign || isAdmin) && (
              <button
                type="button"
                onClick={() => setShowDeleteCampaignModal(true)}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            )}
            {!isMyCampaign && (
              <MyLink
                href={`mailto:contact@pennyseed.fund?subject=Report Campaign [${campaign.id}]&body=I'd like to report the campaign found at https://pennyseed.me/${campaign.id} because [YOUR REASON HERE]`}
              >
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Report
                </button>
              </MyLink>
            )}
          </div>
        )}
      </div>
    </>
  );
}
