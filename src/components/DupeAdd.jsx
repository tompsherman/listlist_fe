import { useState } from "react";
import axios from "axios";
const DupeAdd = ({
  flipNew,
  setFlipNew,
  setFormToggle,
  setNewItem,
  initialFormToggle,
  initialState,
  dupe,
  item_id,
  list_id,
}) => {
  const [toggle, setToggle] = useState(true);
  const [bullet, setBullet] = useState({
    desired_amount: 1,
    list_id: list_id,
    item_id: item_id,
    acquired_amount: 0,
  });

  const clicker = () => {
    setToggle(false);
  };

  const changeDesiredAmount = (event) => {
    event.preventDefault();
    setBullet({ ...bullet, [event.target.name]: event.target.value });
  };

  const submitListItems = (event) => {
    event.preventDefault();
    axios
      // .post(`http://localhost:5505/api/list_items`, bullet)
      .post(`https://listlesslist.herokuapp.com/api/list_items`, bullet)

      .then((response) => console.log("item response:", response))
      .then(() => setNewItem(initialState))
      .then(() => setFormToggle(initialFormToggle))
      .then(() => setFlipNew(!flipNew))
      .catch((error) => console.log(error));
  };

  return toggle ? (
    <div>
      <button onClick={clicker}>add {dupe.name} to list?</button>
    </div>
  ) : (
    <div>
      <h4>how many {dupe.name}?</h4>
      <form onSubmit={submitListItems}>
        <input
          name="desired_amount"
          type="number"
          value={bullet.desired_amount}
          onChange={changeDesiredAmount}
          placeholder={`enter amount to purchase`}
        />
        <button>submit item</button>
      </form>
    </div>
  );
};

export default DupeAdd;
