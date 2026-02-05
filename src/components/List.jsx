import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import GeneralList from "./list-types/GeneralList";
import PantryList from "./list-types/PantryList";

const List = ({ getList, flipNew }) => {
  // PANTRY - different background color, no "goshopping" button
  // GROCERY - how list is built currently

  const [items, setItems] = useState([]);

  const exactList = GetListIdHook(getList);

  console.log("EXACT LIST", items);

  let estPrice = 0;

  for (let i = 0; i < items.length; i++) {
    estPrice = estPrice + parseInt(items[i].cost);
  }

  console.log("EST PRICE", estPrice);

  const axiosCall = (route) => {
    console.log("LIST 26 -- route", route);
    axios
      // .get(`http://localhost:5505/api/lists/${route}/items`)
      .get(`https://listlist-db.onrender.com/api/lists/${route}/items`)
      .then((response) =>
        //console.log("LINE 35,", response.data))
        setItems(response.data)
      )
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  };

  let testVar = undefined;

  exactList ? (testVar = exactList.list_id) : (testVar = "");

  useEffect(() => {
    axiosCall(testVar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactList, flipNew]);

  return exactList && exactList.type === "grocery" && items[0] ? (
    items[0].name ? (
      <div>
        <h2 className="centered">{items[0].type} list</h2>
        <GeneralList array={items} keyword={"vegetable"} />
        <GeneralList array={items} keyword={"herbs"} />
        <GeneralList array={items} keyword={"fruit"} />
        <GeneralList array={items} keyword={"grains"} />
        <GeneralList array={items} keyword={"meat"} />
        <GeneralList array={items} keyword={"dairy"} />
        <GeneralList array={items} keyword={"household"} />
        <GeneralList array={items} keyword={"snack"} />
        <GeneralList array={items} keyword={"drinks"} />
        <div className="flex-row">
          <h3>est. cost:</h3> <h3>${estPrice}</h3>
        </div>
      </div>
    ) : (
      <div>
        <h2>oh no! youre listless!</h2>
      </div>
    )
  ) : exactList && exactList.type === "pantry" && items[0] ? (
    items[0].name ? (
      <div>
        <h2 className="centered">{items[0].type} list</h2>

        <PantryList array={items} keyword={"vegetable"} />
        <PantryList array={items} keyword={"herbs"} />
        <PantryList array={items} keyword={"fruit"} />
        <PantryList array={items} keyword={"grains"} />
        <PantryList array={items} keyword={"herbs"} />
        <PantryList array={items} keyword={"meat"} />
        <PantryList array={items} keyword={"dairy"} />
        <PantryList array={items} keyword={"household"} />
        <PantryList array={items} keyword={"snack"} />
        <PantryList array={items} keyword={"drinks"} />
      </div>
    ) : (
      <div>
        <h2>oh no! youre listless!</h2>
      </div>
    )
  ) : (
    <div>
      <h2>oh no! youre listless!</h2>
    </div>
  );
};

export default List;
