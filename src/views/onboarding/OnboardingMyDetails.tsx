import React, { useContext, useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { updateUser } from '../../helpers/api-helpers';
import { UserContext } from '../../hooks/UserContext';

/*
  Components
*/
import InputField from '../../components/inputs/InputField';
import OnboardingStep from '../../components/OnboardingStep';
import SnackBar from '../../components/validation/SnackBar';

const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://charlies-closet-dev.herokuapp.com'
  : 'http://localhost:8080';

const OnboardingMyDetails = () => {
  const { user, findUser } = useContext(UserContext);
  const token = JSON.parse(localStorage.token);
  const history = useHistory();
  const [firstName, setFirstName] = useState(user.userDetails.first_name);
  const [lastName, setLastName] = useState(user.userDetails.last_name);
  const [maidenName, setMaidenName] = useState(user.userDetails.maiden__name);
  const [telephone, setTelephone] = useState(user.userDetails.telephone);
  const [address, setAddress] = useState(user.userDetails.address);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(false);

  const handleAddressChange = (e: any) => {
    setAddress(e.target.value);
    const search = e.target.value.replace(/\s/g, '');
    fetch(`${baseUrl}/api/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search,
      }),
    })
      .then(response => response.json())
      .then((data: any) => setSuggestions(data))
      .catch(() => setError(true));
  };

  const handleLocationSelect = (placeId: string) => {
    fetch(`${baseUrl}/api/addresses/${placeId}`)
      .then(response => response.json())
      .then((data: any) => setAddress(data.address))
      .catch(() => setError(true));
    setSuggestions([]);
  }

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();
    if (!firstName || !lastName || !telephone || !address) {
      window.scrollTo(0, 0);
      setError(true);
    } else {
      setError(false);
      const newDetailsObj = {
        onboardingProgress: {
          finished: false,
          step: '/onboarding/payment',
        },
        userDetails: {
          first_name: firstName,
          last_name: lastName,
          maiden_name: maidenName,
          telephone,
          address,
        }
      };
      const response = await updateUser(user._id, token, newDetailsObj);
      if (!response.ok) {
        return setError(true);
      }
      findUser();
      history.push('/onboarding/payment');
    }
  };

  if (user.onboardingProgress.finished) {
    return (
      <Redirect to="/account/dashboard" />
    )
  }

  return (
    <>
      <header className="header">
        <div className="header__onboarding">
          <h2 className="header__logo">Charlie's closet</h2>
        </div>
      </header>
      <OnboardingStep handleNext={handleFormSubmit} previous="my-box">
        <form onSubmit={handleFormSubmit} className="form__container">
          <h1 className="form__title">Mes coordonnées</h1>
          <div className="split__container">
          <InputField
              id="first_name"
              label="Prénom"
              type="text"
              value={firstName}
              setValue={setFirstName}
              placeholder="Prénom" />
            <InputField
              id="last_name"
              label="Nom de famille"
              type="text"
              value={lastName}
              setValue={setLastName}
              placeholder="Nom de famille" />
            <InputField
              id="maiden"
              label="Nom de naissance"
              type="text"
              value={maidenName}
              setValue={setMaidenName}
              placeholder="Nom de naissance" />
            <InputField
              id="telephone"
              label="Téléphone"
              type="tel"
              value={telephone}
              setValue={setTelephone}
              placeholder="Téléphone" />
            <div className="address">
              <label>
                Addresse
                <input
                  id="adresse"
                  autoComplete="off"
                  type="text"
                  className={`form__input ${suggestions.length > 0 ? 'drop' : ''}`}
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Rechercher votre addresse" />
              </label>
              {suggestions.length > 0 && (
                <ul className="address__list">
                {suggestions.map((s: any) => (
                  <li className="address__btn" key={s.place_id}>
                    <button type="button" onClick={() => handleLocationSelect(s.place_id)}>
                      {s.description}
                    </button>
                  </li>
                ))}
                </ul>
              )}
            </div>
          </div>
        </form>
      </OnboardingStep>
      {error && <SnackBar type="error" message="Error fetching address" setState={setError} state={error} />}
    </>
  );
};

export default OnboardingMyDetails;
