import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/*
  Components
*/
import Loader from './Loader';
import SnackBar from './SnackBar';

const Examples = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/items')
    .then((response: any) => {
      console.log(response);
      return response.json();
    })
    .then((data: any) => {
      console.log(data)
      setItems(data.slice(0, 6));
      setIsLoading(false);
    })
    .catch(err => {
      console.log(err);
      setError(true);
    })
  }, []);

  return (
    <>
      <section className="examples">
        {!isLoading && items.length > 0 && <div className="examples__container">
          {items.map((item: any) => (
            <Link className="example__link" to={`/boutique/${item._id}`} key={item._id}>
              <img className="example__img" src={item.itemImages[0]} alt={item.itemTitle} />
            </Link>
          ))}
        </div>}
      {isLoading && <Loader />}
      {error && <SnackBar type="error" state={error} setState={setError} message="Cannot fetch the items" />}
      </section>
    </>
  );
};

export default Examples;
