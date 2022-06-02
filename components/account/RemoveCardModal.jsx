/* eslint-disable react/destructuring-assignment */
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationIcon, XIcon } from '@heroicons/react/outline';
import { useUser } from '../../context/user-context';

export default function RemoveCardModal({
  open,
  setOpen,
  selectedPaymentMethod,
  setShowRemoveCardNotification,
  setRemoveCardStatus,
}) {
  const [isRemovingCard, setIsRemovingCard] = useState(false);
  const [didRemoveCard, setDidRemoveCard] = useState(false);
  const { fetchWithAccessToken } = useUser();

  useEffect(() => {
    if (open) {
      setIsRemovingCard(false);
      setDidRemoveCard(false);
    }
  }, [open]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationIcon
                      className="h-6 w-6 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      Remove Card
                    </Dialog.Title>
                    <div className="mt-2">
                      {selectedPaymentMethod && (
                        <p className="text-sm text-gray-500">
                          Are you sure you want to remove{' '}
                          <span className="font-bold">
                            {selectedPaymentMethod.card.brand
                              .charAt(0)
                              .toUpperCase() +
                              selectedPaymentMethod.card.brand.slice(1)}{' '}
                            ending in {selectedPaymentMethod.card.last4}
                          </span>{' '}
                          from your account? All pending campaigns you&apos;ve
                          pledged to will be cancelled. This action cannot be
                          undone.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  {selectedPaymentMethod && (
                    <form
                      method="POST"
                      action="/api/account/remove-payment-method"
                      className="py-2 sm:py-0"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target;
                        const formData = new FormData(form);
                        const data = new URLSearchParams();
                        formData.forEach((value, key) => {
                          data.append(key, value);
                        });
                        setIsRemovingCard(true);
                        const response = await fetchWithAccessToken(
                          form.action,
                          {
                            method: form.method,
                            body: data,
                          }
                        );
                        const { status } = await response.json();
                        console.log('status', status);
                        setDidRemoveCard(true);
                        setRemoveCardStatus(status);
                        setShowRemoveCardNotification(true);
                        setOpen(false);
                      }}
                    >
                      <input
                        required
                        name="paymentMethodId"
                        type="text"
                        defaultValue={selectedPaymentMethod.id}
                        hidden
                      />
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {/* eslint-disable-next-line no-nested-ternary */}
                        {isRemovingCard
                          ? 'Removing Card...'
                          : didRemoveCard
                          ? 'Removed Card!'
                          : 'Remove Card'}
                      </button>
                    </form>
                  )}
                  <button
                    type="button"
                    className="inline-flex·mt-3 w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
