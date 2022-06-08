import { useEffect, useState, createContext, useContext } from 'react';
import {
  supabase,
  getUserProfile,
  supabaseAuthHeader,
  isUserAdmin,
} from '../utils/supabase';
import {
  fetchPaymentMethods,
  fetchPaymentMethod,
} from '../utils/get-payment-methods';

export const UserContext = createContext();

export function UserContextProvider(props) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(supabase.auth.user());
  const [isLoading, setIsLoading] = useState(true);
  const [didDeleteAccount, setDidDeleteAccount] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [baseFetchHeaders, setBaseFetchHeaders] = useState({});
  const [stripeLinks, setStripeLinks] = useState({});

  useEffect(() => {
    if (session?.access_token) {
      setBaseFetchHeaders({ [supabaseAuthHeader]: session.access_token });
    }
  }, [session]);

  useEffect(() => {
    if (session?.access_token) {
      setStripeLinks({
        onboarding: `/api/account/stripe-onboarding?access_token=${session.access_token}`,
        dashboard: `/api/account/stripe-dashboard?access_token=${session.access_token}`,
      });
    }
  }, [session]);

  const fetchWithAccessToken = (url, options) =>
    fetch(url, {
      ...(options || {}),
      headers: { ...(options?.headers || {}), ...baseFetchHeaders },
    });

  const updateUserProfile = async () => {
    const user = supabase.auth.user();
    if (user) {
      const profile = await getUserProfile(user);
      setUser({
        ...user,
        ...profile,
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  const setAuthCookie = async (event, session) => {
    if (session) {
      console.log('setting auth cookie');
      await fetch('/api/account/set-auth-cookie', {
        method: 'POST',
        body: JSON.stringify({ event, session }),
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };

  useEffect(() => {
    const session = supabase.auth.session();
    setSession(session);

    updateUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(event, session);

        setSession(session);
        switch (event) {
          case 'SIGNED_IN':
            await setAuthCookie(event, session);
            await updateUserProfile();
            break;
          case 'SIGNED_OUT':
            setUser(null);
            break;
          case 'TOKEN_REFRESHED':
            await setAuthCookie(event, session);
            await updateUserProfile();
            break;
          case 'USER_UPDATED':
            // await updateUserProfile();
            break;
          case 'USER_DELETED':
            setUser(null);
            break;
          default:
            console.log(`uncaught event "${event}"`);
            break;
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (user) {
      console.log('subscribing to user updates');
      const subscription = supabase
        .from(`profile:id=eq.${user.id}`)
        .on('UPDATE', (payload) => {
          console.log('updated profile');
          setUser({ ...user, ...payload.new });
        })
        .on('DELETE', () => {
          console.log('deleted account');
          signOut();
        })
        .subscribe();
      return () => {
        console.log('unsubscribing to user updates');
        supabase.removeSubscription(subscription);
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsAdmin(isUserAdmin(user));
    }
  }, [user]);

  const deleteAccount = async () => {
    await fetchWithAccessToken('/api/account/delete-account');
    signOut();
    setDidDeleteAccount(true);
  };

  const [paymentMethods, setPaymentMethods] = useState(null);
  const [paymentMethodsObject, setPaymentMethodsObject] = useState({});
  const [isGettingPaymentMethods, setIsGettingPaymentMethods] = useState(false);
  const [numberOfPaymentMethods, setNumberOfPaymentMethods] = useState(null);
  const [getPaymentMethodsStatus, setGetPaymentMethodsStatus] = useState();
  const getPaymentMethods = async (refresh, limit, getMore) => {
    if (!paymentMethods || refresh) {
      setIsGettingPaymentMethods(true);
      const { paymentMethods: newPaymentMethods, status } =
        await fetchPaymentMethods(session, { limit });
      if (status.type === 'succeeded') {
        setPaymentMethods(newPaymentMethods);
      }
      setGetPaymentMethodsStatus(status);
      setIsGettingPaymentMethods(false);
    } else if (getMore) {
      setIsGettingPaymentMethods(true);
      const { paymentMethods: newPaymentMethods, status } =
        await fetchPaymentMethods(session, {
          limit,
          startingAfter: paymentMethods[paymentMethods.length - 1].id,
        });
      if (status.type === 'succeeded') {
        setPaymentMethods(paymentMethods.concat(newPaymentMethods));
      }
      setGetPaymentMethodsStatus(status);
      setIsGettingPaymentMethods(false);
    }
  };
  useEffect(() => {
    if (user) {
      if (user.number_of_payment_methods !== numberOfPaymentMethods) {
        setNumberOfPaymentMethods(user.number_of_payment_methods);
      }
    }
  }, [user]);

  useEffect(() => {
    if (paymentMethods) {
      getPaymentMethods(true);
    }
  }, [numberOfPaymentMethods]);
  const [getPaymentMethodStatus, setGetPaymentMethodStatus] = useState();
  const [isGettingPaymentMethod, setIsGettingPaymentMethod] = useState(false);
  const getPaymentMethod = async (paymentMethodId) => {
    setIsGettingPaymentMethod(true);
    if (!paymentMethodsObject[paymentMethodId]) {
      const { paymentMethod, status } = await fetchPaymentMethod(
        session,
        paymentMethodId
      );
      if (status.type === 'succeeded') {
        const addedPaymentMethod = { [paymentMethodId]: paymentMethod };
        // eslint-disable-next-line no-shadow
        setPaymentMethodsObject({
          ...paymentMethodsObject,
          ...addedPaymentMethod,
        });
      }
      setGetPaymentMethodStatus(status);
    }
    setIsGettingPaymentMethod(false);
  };

  useEffect(() => {
    console.log('paymentMethodsObject', paymentMethodsObject);
  }, [paymentMethodsObject]);

  useEffect(() => {
    let needsUpdate = false;
    const addedPaymentMethods = {};
    paymentMethods?.forEach((paymentMethod) => {
      if (!paymentMethodsObject[paymentMethod.id]) {
        needsUpdate = true;
        addedPaymentMethods[paymentMethod.id] = paymentMethod;
      }
    });
    if (needsUpdate) {
      // eslint-disable-next-line no-shadow
      setPaymentMethodsObject((paymentMethodsObject) => ({
        ...paymentMethodsObject,
        ...addedPaymentMethods,
      }));
    }
  }, [paymentMethods]);

  useEffect(() => {
    console.log('payment methods', paymentMethods);
  }, [paymentMethods]);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = {
    user,
    session,
    signOut,
    deleteAccount,
    isLoading,
    didDeleteAccount,

    fetchWithAccessToken,
    stripeLinks,

    isGettingPaymentMethods,
    paymentMethods,
    getPaymentMethods,
    getPaymentMethodsStatus,
    numberOfPaymentMethods,

    paymentMethodsObject,
    isGettingPaymentMethod,
    getPaymentMethod,
    getPaymentMethodStatus,

    isAdmin,
  };

  return <UserContext.Provider value={value} {...props} />;
}

export function useUser() {
  const context = useContext(UserContext);
  return context;
}
