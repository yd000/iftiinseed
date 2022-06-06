import Head from 'next/head';
import { isMobile } from 'react-device-detect';
import YouTube from 'react-youtube';
import { useEffect, useState } from 'react';
import CampaignForm from '../components/campaign/CampaignForm';
import MyLink from '../components/MyLink';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Home() {
  const YouTubePlayerOptions = {
    playerVars: {
      rel: 0,
      playsinline: 1,
      modestbranding: 0,
    },
  };

  const [isSSR, setIsSSR] = useState(false);
  useEffect(() => {
    setIsSSR(true);
  }, []);

  return (
    <>
      <Head>
        <title>Pennyseed</title>
      </Head>
      <div className="mx-auto max-w-prose text-lg">
        <h1>
          <span className="mt-2 block text-center text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
            What is Pennyseed?
          </span>
        </h1>
      </div>
      <div className="style-links prose prose-lg prose-yellow mx-auto mt-6 text-xl text-gray-500">
        <p>
          Pennyseed is a crowdfunding platform where{' '}
          <span className="font-bold">
            the funding goal is divided by the number of pledgers
          </span>
          .
        </p>

        <p>
          For example, if you want to raise $1,000 and reach 1,000 pledgers,
          then each pledger pays $1. However, if 2,000 people pledge, then each
          pledger pays only $0.50 (before fees; more below).
        </p>

        <p>
          Campaigns require a deadline and a minimum number of pledgers; that
          way people know the maximum possible pledge amount{' '}
          <span className="font-bold">
            (funding goal) / (minimum number of pledgers)
          </span>
          . Otherwise if you wanted to raise $1,000 and only one person pledged
          before the deadline, then they&apos;d pay $1,000 (which would be
          ridiculous).
        </p>

        <p>
          Payments are done via{' '}
          <a href="https://stripe.com/" target="_blank" rel="noreferrer">
            Stripe
          </a>
          , and pledge amounts include the{' '}
          <a href="https://stripe.com/pricing" target="_blank" rel="noreferrer">
            Stripe processing fees
          </a>{' '}
          <span className="inline-block">(2.9% + $0.30)</span> and a 1%
          Pennyseed fee, so the campaigner gets exactly how much they ask for.
          For example, if you successfully raise $1,000 with 1,000 pledgers,
          each pledger won&apos;t actually pay $1, but will pay $1.35 ($1.00 +
          fees).
        </p>

        <p className="mb-6">
          Try out the Campaign Example below to see what creating a campaign is
          like:
        </p>

        <CampaignForm isExample />

        {isSSR && (
          <>
            <p className="mb-3">
              <span className="mt-2 block text-center text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Creating a Campaign
              </span>
            </p>
            <YouTube
              className="mx-auto"
              iframeClassName={classNames(
                isMobile ? 'aspect-square' : 'aspect-video',
                'mx-auto w-full'
              )}
              title="Creating a Campaign"
              videoId={isMobile ? 'ryElmlpMzJU' : 'Fod9zHVh20U'}
              opts={YouTubePlayerOptions}
            />

            <p className="mb-3">
              <span className="mt-4 block text-center text-xl font-bold leading-8 tracking-tight text-gray-900 sm:text-2xl">
                Pledging to a Campaign
              </span>
            </p>
            <YouTube
              className="mx-auto"
              iframeClassName={classNames(
                isMobile ? 'aspect-square' : 'aspect-video',
                'mx-auto w-full'
              )}
              title="Pledging to a Campaign"
              videoId={isMobile ? 'XOHp_syTNZg' : 'mf9FjI6iHOI'}
              opts={YouTubePlayerOptions}
            />
          </>
        )}

        <p>
          This project is built using{' '}
          <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
            Next.js
          </a>{' '}
          for the website,{' '}
          <a href="https://supabase.com/" target="_blank" rel="noreferrer">
            Supabase
          </a>{' '}
          for user authentication and minimal data storage (see our{' '}
          <MyLink href="/privacy">privacy policy</MyLink> for what information
          we store), and is hosted on{' '}
          <a href="https://vercel.com/" target="_blank" rel="noreferrer">
            Vercel
          </a>
          . We also use{' '}
          <a href="https://stripe.com/" target="_blank" rel="noreferrer">
            Stripe
          </a>{' '}
          for payment processing and{' '}
          <a href="https://sendgrid.com/" target="_blank" rel="noreferrer">
            SendGrid
          </a>{' '}
          for emailing campaign updates to users (by default we only send
          sign-in links and pledge receipts - you can opt-in to additional
          notifictions in your account settings). The source code is{' '}
          <a
            href="https://github.com/zakaton/pennyseed"
            target="_blank"
            rel="noreferrer"
          >
            available here
          </a>
          .
        </p>

        <p>
          For more information check out <MyLink href="/faq">FAQ</MyLink>.
        </p>
      </div>
    </>
  );
}
