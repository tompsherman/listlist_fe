import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import GeneralList from "./list-types/GeneralList";
import PantryList from "./list-types/PantryList";
import PantrySearch from "./PantrySearch";
import CookDish from "./CookDish";
import { STORAGE_LOCATIONS, CATEGORIES } from "../utils/categories";

const List = ({ getList, flipNew, onAddItem }) => {
  // PANTRY - different background color, no "goshopping" button
  // GROCERY - how list is built currently

  const [items, setItems] = useState([]);
  const [groupBy, setGroupBy] = useState("category"); // "category" or "storage"
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [cookingItem, setCookingItem] = useState(null); // For CookDish modal

  const exactList = GetListIdHook(getList);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (isLoading && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isLoading, countdown]);

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
    
    axios
      .get(`https://listlist-db.onrender.com/api/lists/${route}/items`)
      .then((response) => {
        setItems(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error.message, error.stack);
        setIsLoading(false);
      });
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
        
        {/* Pantry Search */}
        <PantrySearch 
          pantryItems={items} 
          pantryListId={testVar}
          onItemAdded={refreshList}
          onAddItem={onAddItem}
          onCookItem={setCookingItem}
        />
        
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
              <PantryList key={cat} array={items} keyword={cat} onItemRemoved={refreshList} groupBy="category" allPantryItems={items} pantryListId={testVar} onCookItem={setCookingItem} />
            ))}
          </>
        ) : (
          <>
            {STORAGE_LOCATIONS.map(loc => (
              <PantryList key={loc} array={items} keyword={loc} onItemRemoved={refreshList} groupBy="storage" allPantryItems={items} pantryListId={testVar} onCookItem={setCookingItem} />
            ))}
          </>
        )}

        {/* CookDish Modal */}
        {cookingItem && (
          <CookDish
            initialIngredient={cookingItem}
            pantryItems={items}
            pantryListId={testVar}
            onClose={() => setCookingItem(null)}
            onCooked={refreshList}
          />
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
