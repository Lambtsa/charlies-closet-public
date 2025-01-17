import React, { useContext, useState, useEffect } from "react";
import { Redirect } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { UserContext } from '../hooks/UserContext';
import { getBoxById, updateUser, createSubscription } from '../helpers/api-helpers';

/*
  Components
*/
import OnboardingStep from './OnboardingStep';
import SnackBar from './validation/SnackBar';
import InputField from './inputs/InputField';
import FullScreenLoader from "./validation/FullScreenLoader";

export const CheckoutForm = () => {
  const { user, findUser } = useContext(UserContext);
  const token = JSON.parse(localStorage.token);
  const stripe: any = useStripe();
  const elements: any = useElements();
  const [name, setName] = useState('');
  const [selectedBox, SetSelectedBox] = useState<any>();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    getBoxById(user.pricePlanId)
      .then(response => response.json())
      .then((data: any) => SetSelectedBox(data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
      /* eslint-disable-next-line */
  }, []);

  const handleFormSubmit = async (e: any) => {
    setPaymentMessage('validation du paiement...');
    setIsPaying(true);
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }
    /* Create subscription */
    const customer = {
      name: `${user.userDetails.first_name} ${user.userDetails.last_name}`,
      email: user.email,
      priceId: user.pricePlanId,
    }
    const response = await createSubscription(customer, token);
    if (!response.ok) {
      setError(true);
      setErrorMessage('issue');
    }
    const data = await response.json();
    console.log(data);

    /* Accept payment */
    const cardElement = elements.getElement(CardNumberElement);
    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: name,
        },
      }
    });
    if(result.error) {
      window.scrollTo(0,0);
      setIsPaying(false);
      setError(true);
      setErrorMessage(result.error.message);
    } else {
      console.log(result);
      setPaymentMessage('Paiement validé');
      const response = await updateUser(user._id, token, { 
        onboardingProgress: {
          finished: true,
          step: '/account/dashboard',
        },
      });
      if (!response.ok) {
        setError(true);
      } else {
        findUser()
      }
    };
  };

  const CARD_OPTIONS: any = {
    style: {
      base: {
        iconColor: "#60764D",
        backgroundColor: 'transparent',
        color: "#60764D",
        fontWeight: 400,
        fontFamily: "'Nunito', sans-serif",
        fontSize: "16px",
        fontSmoothing: "antialiased",
        ":-webkit-autofill": {
          color: "#60764D"
        },
        "::placeholder": {
          color: "rgba(96, 118, 77, 0.6)"
        }
      },
      invalid: {
        iconColor: "#E08585",
        color: "#E08585"
      }
    }
  };

  if (user.onboardingProgress.finished) {
    return (
      <Redirect to="/account/dashboard" />
    )
  }

  return (
    <>
      {error && <SnackBar type="error" message={errorMessage} setState={setError} state={error} />}
      {isPaying && <FullScreenLoader loaderText={paymentMessage} />}
      <OnboardingStep previous="my-details" handlePayment={handleFormSubmit}>
        <div className="form__container">
          <h1 className="form__title">Paiement</h1>
          <div className="split__container">
            <div className="split__left payment">
              <InputField
                id="name"
                label="Nom indiqué sur la carte"
                type="text"
                value={name}
                setValue={setName}
                placeholder="Nom indiqué sur la carte" />
              <label htmlFor="cardNumber">
                Numéro de carte
                <CardNumberElement
                  id="cardNumber"
                  options={CARD_OPTIONS}
                  className="form__card" />
              </label>
              <label htmlFor="expiry">
                Date d'expiration
                <CardExpiryElement
                  id="expiry"
                  options={CARD_OPTIONS}
                  className="form__card" />
              </label>
              <label htmlFor="cvc">
                Cryptogramme visuel
                <CardCvcElement
                  id="cvc"
                  options={CARD_OPTIONS}
                  className="form__card" />
              </label>
            </div>
            {!isLoading && (
              <div className="payment__details">
                <div className="box__details">
                  <h2 className="box__title">{selectedBox.boxTitle}</h2>
                  <ul>
                    {selectedBox.boxServices.map((service: any, index: number) => (
                      <li key={index} className="box__list payment">
                        <p>{service}</p>
                        <p>inclus</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="box__price">{`${selectedBox.boxPrice} €/mois`}</p>
              </div>
            )}
          </div>
          <div className="info__container">
            <FontAwesomeIcon className="info__icon" icon={faLock} />
            <p>Ce site est sécurisé par un certificat SSL pour assurer la protection de vos données.</p>
          </div>
        </div>
      </OnboardingStep>
    </>
  );
};