import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../../hooks/UserContext';
import { updateUser, getAllBoxes } from '../../helpers/api-helpers';

/*
  Components
*/
import OnboardingStep from '../../components/OnboardingStep';
import SnackBar from '../../components/SnackBar';
import Box from '../../components/Box';

const MyBox = () => {
  const { user, findUser } = useContext(UserContext);
  const token = JSON.parse(localStorage.token);
  const history = useHistory();
  const [selected, setSelected] = useState(user.boxId);
  const [boxes, setBoxes] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAllBoxes()
      .then(response => response.json())
      .then((data: any) => setBoxes(data))
      .catch(() => setError(true))
  }, []);

  const handleBtnClick = (btnId: string) => {
    setSelected(btnId);
  }
  const handleFormSubmit = async (e: any) => {
    e.preventDefault();
    const response = await updateUser(user._id, token, { boxId: selected });
    if (!response.ok) {
      return setError(true);
    }
    findUser();
    history.push('/onboarding/my-details');
  };

  return (
    <>
      <header className="header">
        <div className="header__onboarding">
          <h2 className="header__logo">Charlie's closet</h2>
        </div>
      </header>
      <OnboardingStep handleNext={handleFormSubmit} previous="my-baby">
        <div className="boxes__container">
          {error && <SnackBar state={error} setState={setError} type="error" message="Problem with boxes" />}
          <h1 className="boxes__title">Ma box</h1>
          <div className="split__container">
            {boxes.length > 0 && boxes.map((box: any) => (
              <Box key={box._id} boxObj={box} handleBtnClick={handleBtnClick} selected={selected} />
            ))}
          </div>
        </div>
      </OnboardingStep>
    </>
  );
};

export default MyBox;
