import { useState } from 'react';
import { supabase } from '../utils/supabase-client';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  async function signIn() {
    if (!email) {
      return;
    }

    // eslint-disable-next-line no-unused-vars
    const { error, data } = await supabase.auth.signIn({
      email,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.log({ error });
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Thank you
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Check your email for a confirmation link
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We'll send a link to your email - no password required
          </p>
        </div>
        <form className="mt-8 space-y-6" action="#" method="POST">
          <input type="hidden" name="remember" defaultValue="true" />
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
                onInput={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault();
                signIn();
              }}
            >
              Send link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
