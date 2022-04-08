import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";

const List = ({ getList, currentList, flipNew }) => {
  // getList variable = which type of list component to display
  // PANTRY - different background color, no "goshopping" button
  // GROCERY - how list is built currently

  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  console.log("GET LIST PROP", getList, "CURRENT LIST PROP", currentList);

  // let currentList = "";

  // useEffect(() => {
  //   axios
  //     // .get(`https://whats-n-da-fridge.herokuapp.com/api/lists/`)
  //     .get("http://localhost:5505/api/lists/")
  //     .then((response) => setList(response.data))
  //     // .then(console.log("GET list", list))
  //     .catch((error) => console.log(error.message, error.stack));
  // }, []);

  // console.log("line 17", list, getList);

  // const exactList =
  //   list.length && getList === "*"
  //     ? (currentList = list
  //         .reverse()
  //         .find((list) => list.starred_list === getList))
  //     : list.length && getList.length
  //     ? (currentList = list.reverse().find((list) => list.type === getList))
  //     : (currentList = [{ list_id: "" }]);
  console.log(
    "LIST GET LIST ID HOOK for exactList passing in getList",
    getList
  );

  const exactList = GetListIdHook(getList);
  // const exactList =
  console.log("EXACT LIST", exactList);

  // console.log("line 27", list, currentList, getList);
  const axiosCall = (route) => {
    axios
      // .get(`https://whats-n-da-fridge.herokuapp.com/api/lists/${ID_VARIABLE}`)
      .get(`http://localhost:5505/api/lists/${route}`)
      .then((response) =>
        //console.log("LINE 35,", response.data))
        setItems(response.data)
      )
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  };
  let testVar = undefined;

  exactList ? (testVar = exactList.list_id) : (testVar = "");

  testVar
    ? console.log("testvar = true", testVar)
    : console.log("testvar as undefined is false");
  useEffect(() => {
    axiosCall(testVar);
  }, [exactList, flipNew]);

  // console.log("ITEMS", items);
  const meatList = items.filter((item) => item.category === "meat");
  const dairyList = items.filter((item) => item.category === "dairy");
  const vegetableList = items.filter((item) => item.category === "vegetable");
  const fruitList = items.filter((item) => item.category === "fruit");
  const grainsList = items.filter((item) => item.category === "grains");
  const householdList = items.filter((item) => item.category === "household");
  const herbsList = items.filter((item) => item.category === "herbs");
  const snackList = items.filter((item) => item.category === "snack food");
  const drinksList = items.filter((item) => item.category === "drinks");

  console.log("list", exactList, items, "vegatble:", vegetableList);

  return exactList && exactList.type === "grocery" && items[0] ? (
    items[0].name ? (
      <div>
        <h2 className="centered">{items[0].type} list</h2>

        {vegetableList.length ? (
          <div className="vegetable">
            <h3>{vegetableList[0].category}</h3>
            {vegetableList.map((vegetable) => (
              <div className="item">
                <p>{vegetable.desired_amount}</p>
                <p>{vegetable.name}</p>
              </div>
            ))}
          </div>
        ) : null}
        {herbsList.length ? (
          <div className="herbs">
            <h3>{herbsList[0].category}</h3>
            {herbsList.map((herbs) => (
              <div className="item">
                <p>{herbs.desired_amount}</p>
                <p>{herbs.name}</p>
              </div>
            ))}
          </div>
        ) : null}
        {fruitList.length ? (
          <div className="fruit">
            <h3>{fruitList[0].category}</h3>
            {fruitList.map((fruit) => (
              <div className="item">
                <p>{fruit.desired_amount}</p>
                <p>{fruit.name}</p>
              </div>
            ))}
          </div>
        ) : null}
        {grainsList.length ? (
          <div className="grains">
            <h3>{grainsList[0].category}</h3>
            {grainsList.map((grains) => (
              <div className="item">
                <p>{grains.desired_amount}</p>
                <p>{grains.name}</p>
              </div>
            ))}
          </div>
        ) : null}
        {meatList.length ? (
          <div className="meat">
            <h3>{meatList[0].category}</h3>
            <div className="list_container">
              {meatList.map((meat) => (
                <div className="item">
                  <p>{meat.desired_amount}</p>
                  <p>{meat.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {dairyList.length ? (
          <div className="dairy">
            <h3>{dairyList[0].category}</h3>
            <div className="list_container">
              {dairyList.map((dairy) => (
                <div className="item">
                  <p>{dairy.desired_amount}</p>
                  <p>{dairy.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {drinksList.length ? (
          <div className="drinks">
            <h3>{drinksList[0].category}</h3>
            <div className="list_container">
              {drinksList.map((drinks) => (
                <div className="item">
                  <p>{drinks.desired_amount}</p>
                  <p>{drinks.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {householdList.length ? (
          <div className="household">
            <h3>{householdList[0].category}</h3>
            {householdList.map((household) => (
              <div className="item">
                <p>{household.desired_amount}</p>
                <p>{household.name}</p>
              </div>
            ))}
          </div>
        ) : null}
        {snackList.length ? (
          <div className="snack">
            <h3>{snackList[0].category}</h3>
            {snackList.map((snack) => (
              <div className="item">
                <p>{snack.desired_amount}</p>
                <p>{snack.name}</p>
              </div>
            ))}
          </div>
        ) : null}
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

        {vegetableList.length ? (
          <div className="vegetable">
            <h3>{vegetableList[0].category}</h3>
            {vegetableList.map((vegetable) => (
              <div className="item">
                <p>{vegetable.acquired_amount}</p>
                <p>{vegetable.name}</p>
                <p>{vegetable.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
        {herbsList.length ? (
          <div className="herbs">
            <h3>{herbsList[0].category}</h3>
            {herbsList.map((herbs) => (
              <div className="item">
                <p>{herbs.acquired_amount}</p>
                <p>{herbs.name}</p>
                <p>{herbs.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
        {fruitList.length ? (
          <div className="fruit">
            <h3>{fruitList[0].category}</h3>
            {fruitList.map((fruit) => (
              <div className="item">
                <p>{fruit.acquired_amount}</p>
                <p>{fruit.name}</p>
                <p>{fruit.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
        {grainsList.length ? (
          <div className="grains">
            <h3>{grainsList[0].category}</h3>
            {grainsList.map((grains) => (
              <div className="item">
                <p>{grains.acquired_amount}</p>
                <p>{grains.name}</p>
                <p>{grains.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
        {meatList.length ? (
          <div className="meat">
            <h3>{meatList[0].category}</h3>
            <div className="list_container">
              {meatList.map((meat) => (
                <div className="item">
                  <p>{meat.acquired_amount}</p>
                  <p>{meat.name}</p>
                  <p>{meat.purchase_date}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {dairyList.length ? (
          <div className="dairy">
            <h3>{dairyList[0].category}</h3>
            <div className="list_container">
              {dairyList.map((dairy) => (
                <div className="item">
                  <p>{dairy.acquired_amount}</p>
                  <p>{dairy.name}</p>
                  <p>{dairy.purchase_date}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {drinksList.length ? (
          <div className="drinks">
            <h3>{drinksList[0].category}</h3>
            <div className="list_container">
              {drinksList.map((drinks) => (
                <div className="item">
                  <p>{drinks.acquired_amount}</p>
                  <p>{drinks.name}</p>
                  <p>{drinks.purchase_date}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {householdList.length ? (
          <div className="household">
            <h3>{householdList[0].category}</h3>
            {householdList.map((household) => (
              <div className="item">
                <p>{household.acquired_amount}</p>
                <p>{household.name}</p>
                <p>{household.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
        {snackList.length ? (
          <div className="snack">
            <h3>{snackList[0].category}</h3>
            {snackList.map((snack) => (
              <div className="item">
                <p>{snack.acquired_amount}</p>
                <p>{snack.name}</p>
                <p>{snack.purchase_date}</p>
              </div>
            ))}
          </div>
        ) : null}
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
