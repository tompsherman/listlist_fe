import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import GeneralList from "./list-types/GeneralList";
import PantryList from "./list-types/PantryList";

const STORAGE_LOCATIONS = ["counter", "pantry", "fridge", "freezer", "closet"];
const CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "household", "snack", "drinks"];

const List = ({ getList, flipNew }) => {
  // PANTRY - different background color, no "goshopping" button
  // GROCERY - how list is built currently

  const [items, setItems] = useState([]);
  const [groupBy, setGroupBy] = useState("category"); // "category" or "storage"
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef(null);

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
    setIsLoading(true);
    setCountdown(30);
    
    // Start countdown timer
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    axios
      .get(`https://listlist-db.onrender.com/api/lists/${route}/items`)
      .then((response) => {
        setItems(response.data);
        setIsLoading(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
      })
      .catch((error) => {
        console.log(error.message, error.stack);
        setIsLoading(false);
        if (countdownRef.current) clearInterval(countdownRef.current);
      });
  };

  let testVar = undefined;

  exactList ? (testVar = exactList.list_id) : (testVar = "");

  useEffect(() => {
    // Only make API call if we have a valid list ID
    if (testVar) {
      axiosCall(testVar);
    }
    // Cleanup interval on unmount
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactList, flipNew]);

  // Refresh function for when pantry items are removed
  const refreshList = () => {
    if (testVar) {
      axiosCall(testVar);
    }
  };

  // Show loading screen with countdown
  if (isLoading) {
    return (
      <div className="loading-screen">
        <h2>Loading...</h2>
        <div className="countdown">{countdown}...</div>
        <p>Waking up the database</p>
      </div>
    );
  }

  return exactList && exactList.type === "grocery" && items[0] ? (
    items[0].name ? (
      <div>
        <div className="list-header">
          <h2 className="centered">{items[0].type} list</h2>
          <p className="est-cost">est. cost: ${estPrice}</p>
        </div>
        <GeneralList array={items} keyword={"vegetable"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"herbs"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"fruit"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"grains"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"meat"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"dairy"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"household"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"snack"} onItemRemoved={refreshList} />
        <GeneralList array={items} keyword={"drinks"} onItemRemoved={refreshList} />
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
        
        {/* Group by toggle */}
        <div className="group-toggle">
          <span>Group by: </span>
          <button 
            className={`toggle-btn ${groupBy === "category" ? "active" : ""}`}
            onClick={() => setGroupBy("category")}
          >
            category
          </button>
          <button 
            className={`toggle-btn ${groupBy === "storage" ? "active" : ""}`}
            onClick={() => setGroupBy("storage")}
          >
            location
          </button>
        </div>

        {groupBy === "category" ? (
          <>
            {CATEGORIES.map(cat => (
              <PantryList key={cat} array={items} keyword={cat} onItemRemoved={refreshList} groupBy="category" />
            ))}
          </>
        ) : (
          <>
            {STORAGE_LOCATIONS.map(loc => (
              <PantryList key={loc} array={items} keyword={loc} onItemRemoved={refreshList} groupBy="storage" />
            ))}
          </>
        )}
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
