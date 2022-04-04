import React, { useState, useEffect } from "react";
import axios from "axios";

const List = () => {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios
      // .get(`https://whats-n-da-fridge.herokuapp.com/api/lists/`)
      .get("http://localhost:5505/api/lists/")
      .then((response) => setList(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  let currentList = list[list.length - 1];

  useEffect(() => {
    axios
      // .get(`https://whats-n-da-fridge.herokuapp.com/api/lists/${ID_VARIABLE}`)
      .get("http://localhost:5505/api/lists/1")
      .then((response) => setItems(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  console.log("line 28", currentList, items);

  return items[0] ? (
    <div>
      <h2>{items[0].type}</h2>
      {items.map((item) => (
        <div className="item">
          <p>{item.desired_amount}</p>
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  ) : (
    <h2>oh no! youre listless!</h2>
  );
};

export default List;
