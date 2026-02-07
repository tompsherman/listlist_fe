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
    const cost = parseInt(items[i].cost) || 0;
    const quantity = parseInt(items[i].desired_amount) || 1;
    estPrice = estPrice + (cost * quantity);
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
    // Only make API call if we have a valid list ID
    if (testVar) {
      axiosCall(testVar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactList, flipNew]);

  // Refresh function for when pantry items are removed
  const refreshList = () => {
    if (testVar) {
      axiosCall(testVar);
    }
  };

  return exactList && exactList.type === "grocery" && items[0] ? (
    items[0].name ? (
      <div>
        <div className="list-header">
          <h2 className="centered">{items[0].type} list</h2>
          <p className="est-cost">est. cost: ${estPrice}</p>
        </div>
        <GeneralList array={items} keyword={"vegetable"} />
        <GeneralList array={items} keyword={"herbs"} />
        <GeneralList array={items} keyword={"fruit"} />
        <GeneralList array={items} keyword={"grains"} />
        <GeneralList array={items} keyword={"meat"} />
        <GeneralList array={items} keyword={"dairy"} />
        <GeneralList array={items} keyword={"household"} />
        <GeneralList array={items} keyword={"snack"} />
        <GeneralList array={items} keyword={"drinks"} />
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

        <PantryList array={items} keyword={"vegetable"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"herbs"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"fruit"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"grains"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"meat"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"dairy"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"household"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"snack"} onItemRemoved={refreshList} />
        <PantryList array={items} keyword={"drinks"} onItemRemoved={refreshList} />
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
