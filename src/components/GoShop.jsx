import React, { useState, useEffect, useRef } from "react";
import GetListIdHook from "../logic/GetListIdHook";
import GetListItemsHook from "../logic/GetListItemsHook";
import axios from "axios";
const GoShop = ({ getList, currentList, setShopping }) => {
  console.log("goshop current list:", currentList);
  const [categoryShown, setCategoryShown] = useState({
    vegetable: true,
    herbs: true,
    fruit: true,
    grains: true,
    meat: true,
    dairy: true,
    drinks: true,
    household: true,
    snacks: true,
    // cart: false,
  });
  const [cart, setCart] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [grocery, setGrocery] = useState([]);

  console.log(
    "SHOP GET LIST ID HOOK for futureList passing in getList",
    getList
  );
  const futureList = GetListIdHook(getList);
  const shopList = GetListItemsHook(currentList.list_id);
  // we should have GET USER LIST HOOKs, right now will hardcode in the pantry list
  // console.log(
  //   "getList,",
  //   getList,
  //   "current list:",
  //   currentList,
  //   "future list number:",
  //   futureList
  // );

  useEffect(() => {
    const parseList = shopList.map((item) => {
      let parsedListObject = {
        name: item.name,
        desired_amount: item.desired_amount,
        // acquired_amount: 0,
        item_id: item.item_id,
        fulfilled: false,
        category: item.category,
      };
      return parsedListObject;
    });

    let cartState = {};

    parseList.forEach(
      (listItem) =>
        (cartState[listItem.name] = {
          name: listItem.name,
          item_id: listItem.item_id,
          desired_amount: listItem.desired_amount,
          acquired_amount: 0,
          fulfilled: false,
          category: listItem.category,
        })
    );

    setCart(cartState);
    // setCategoryShown({ ...categoryShown, cart: true });
  }, [shopList]);

  // console.log("the cart", categoryShown);
  console.log("SHOP GET LIST ID HOOK for getPantryList passing in pantry");

  const getPantryList = GetListIdHook("pantry");
  // const getGroceryList = GetListIdHook("grocery");

  const doneShopping = (event) => {
    console.log(
      "WTF do we have??",
      "cart:",
      cart,
      "shopList",
      shopList,
      "event",
      event.timeStamp
    );
    let panArr = [];
    let grocArr = [];

    shopList.forEach((item) => {
      if (cart[item.name].fulfilled === 1) {
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          purchased_timestamp: event.timeStamp,
          desired_amount: 0,
          list_id: getPantryList.list_id,
          amount_left:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
        });
      } else if (
        cart[item.name].fulfilled === 0 ||
        !cart[item.name].fulfilled
      ) {
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount: 0,
          purchased_timestamp: event.timeStamp,
          desired_amount: cart[item.name].desired_amount,
          list_id: futureList.list_id,
        });
      } else {
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          purchased_timestamp: event.timeStamp,
          desired_amount: 0,
          list_id: getPantryList.list_id,
          amount_left:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
        });
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount: 0,
          purchased_timestamp: event.timeStamp,
          desired_amount:
            cart[item.name].desired_amount -
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          list_id: futureList.list_id,
        });
      }
      return panArr && grocArr;
    });
    console.log("outside the function:", panArr, grocArr);
    // event.preventDefault();
    axios
      .post(`http://localhost:5505/api/list_items/bulk_add`, panArr)
      .then((response) => console.log("item response:", response))
      .catch((error) => console.log(error));
    setPantry(panArr);
    setGrocery(grocArr);
    setShopping(false);
  };

  // console.log(pantry, grocery);

  const meatList = shopList.filter((item) => item.category === "meat");
  const dairyList = shopList.filter((item) => item.category === "dairy");
  const vegetableList = shopList.filter(
    (item) => item.category === "vegetable"
  );
  const fruitList = shopList.filter((item) => item.category === "fruit");
  const grainsList = shopList.filter((item) => item.category === "grains");
  const householdList = shopList.filter(
    (item) => item.category === "household"
  );
  const herbsList = shopList.filter((item) => item.category === "herbs");
  const snackList = shopList.filter((item) => item.category === "snack food");
  const drinksList = shopList.filter((item) => item.category === "drinks");

  const collapseCategory = (event) => {
    setCategoryShown({
      ...categoryShown,
      [event.target.innerText]: !categoryShown[event.target.innerText],
    });
    // console.log(event.target.innerText);
  };

  const addToCart = (event) => {
    setCart({
      ...cart,
      [cart[event.target.name].name]: {
        ...cart[event.target.name],
        acquired_amount: event.target.value,
        still_need: cart[event.target.name].desired_amount - event.target.value,
        fulfilled: event.target.value / cart[event.target.name].desired_amount,
      },
    });
  };

  return (
    <div className="GoShop">
      <h2>GoShop</h2>
      <div>
        {Object.keys(cart).length &&
        vegetableList.length &&
        categoryShown.vegetable ? (
          <div className="vegetable" onClick={collapseCategory}>
            <h3>{vegetableList[0].category}</h3>
            {vegetableList.map((vegetable) => (
              <div className="item">
                <input
                  name={vegetable.name}
                  type="range"
                  min="0"
                  max={vegetable.desired_amount}
                  value={cart[vegetable.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[vegetable.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{vegetable.desired_amount}</p>
                    <p>{vegetable.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{vegetable.desired_amount}</p>
                    <p>{vegetable.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : vegetableList.length && !categoryShown.vegetable ? (
          <div className="vegetable" onClick={collapseCategory}>
            <h3>{vegetableList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length && herbsList.length && categoryShown.herbs ? (
          <div className="herbs" onClick={collapseCategory}>
            <h3>{herbsList[0].category}</h3>
            {herbsList.map((herbs) => (
              <div className="item">
                <input
                  name={herbs.name}
                  type="range"
                  min="0"
                  max={herbs.desired_amount}
                  value={cart[herbs.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[herbs.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{herbs.desired_amount}</p>
                    <p>{herbs.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{herbs.desired_amount}</p>
                    <p>{herbs.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : herbsList.length && !categoryShown.herbs ? (
          <div className="herbs" onClick={collapseCategory}>
            <h3>{herbsList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length && fruitList.length && categoryShown.fruit ? (
          <div className="fruit" onClick={collapseCategory}>
            <h3>{fruitList[0].category}</h3>
            {fruitList.map((fruit) => (
              <div className="item">
                <input
                  name={fruit.name}
                  type="range"
                  min="0"
                  max={fruit.desired_amount}
                  value={cart[fruit.name].acquired_amount}
                  onChange={addToCart}
                />
                {cart[fruit.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{fruit.desired_amount}</p>
                    <p>{fruit.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{fruit.desired_amount}</p>
                    <p>{fruit.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : fruitList.length && !categoryShown.fruit ? (
          <div className="fruit" onClick={collapseCategory}>
            <h3>{fruitList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length &&
        grainsList.length &&
        categoryShown.grains ? (
          <div className="grains" onClick={collapseCategory}>
            <h3>{grainsList[0].category}</h3>
            {grainsList.map((grains) => (
              <div className="item">
                <input
                  name={grains.name}
                  type="range"
                  min="0"
                  max={grains.desired_amount}
                  value={cart[grains.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[grains.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{grains.desired_amount}</p>
                    <p>{grains.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{grains.desired_amount}</p>
                    <p>{grains.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : grainsList.length && !categoryShown.grains ? (
          <div className="grains" onClick={collapseCategory}>
            <h3>{grainsList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length && meatList.length && categoryShown.meat ? (
          <div className="meat" onClick={collapseCategory}>
            <h3>{meatList[0].category}</h3>
            <div className="list_container">
              {meatList.map((meat) => (
                <div className="item">
                  <input
                    name={meat.name}
                    type="range"
                    min="0"
                    max={meat.desired_amount}
                    value={cart[meat.name].acquired_amount}
                    onChange={addToCart}
                  />

                  {cart[meat.name].fulfilled === 1 ? (
                    <div className="flex-row strikethrough">
                      <p>{meat.desired_amount}</p>
                      <p>{meat.name}</p>
                    </div>
                  ) : (
                    <div className="flex-row">
                      <p>{meat.desired_amount}</p>
                      <p>{meat.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : meatList.length && !categoryShown.meat ? (
          <div className="meat" onClick={collapseCategory}>
            <h3>{meatList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length && dairyList.length && categoryShown.dairy ? (
          <div className="dairy" onClick={collapseCategory}>
            <h3>{dairyList[0].category}</h3>
            <div className="list_container">
              {dairyList.map((dairy) => (
                <div className="item">
                  <input
                    name={dairy.name}
                    type="range"
                    min="0"
                    max={dairy.desired_amount}
                    value={cart[dairy.name].acquired_amount}
                    onChange={addToCart}
                  />

                  {cart[dairy.name].fulfilled === 1 ? (
                    <div className="flex-row strikethrough">
                      <p>{dairy.desired_amount}</p>
                      <p>{dairy.name}</p>
                    </div>
                  ) : (
                    <div className="flex-row">
                      <p>{dairy.desired_amount}</p>
                      <p>{dairy.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : dairyList.length && !categoryShown.dairy ? (
          <div className="dairy" onClick={collapseCategory}>
            <h3>{dairyList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        drinksList.length &&
        categoryShown.drinks ? (
          <div className="drinks" onClick={collapseCategory}>
            <h3>{drinksList[0].category}</h3>
            <div className="list_container">
              {drinksList.map((drinks) => (
                <div className="item">
                  <input
                    name={drinks.name}
                    type="range"
                    min="0"
                    max={drinks.desired_amount}
                    value={cart[drinks.name].acquired_amount}
                    onChange={addToCart}
                  />

                  {cart[drinks.name].fulfilled === 1 ? (
                    <div className="flex-row strikethrough">
                      <p>{drinks.desired_amount}</p>
                      <p>{drinks.name}</p>
                    </div>
                  ) : (
                    <div className="flex-row">
                      <p>{drinks.desired_amount}</p>
                      <p>{drinks.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : drinksList.length && !categoryShown.drinks ? (
          <div className="drinks" onClick={collapseCategory}>
            <h3>{drinksList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        householdList.length &&
        categoryShown.household ? (
          <div className="household" onClick={collapseCategory}>
            <h3>{householdList[0].category}</h3>
            {householdList.map((household) => (
              <div className="item">
                <input
                  name={household.name}
                  type="range"
                  min="0"
                  max={household.desired_amount}
                  value={cart[household.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[household.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{household.desired_amount}</p>
                    <p>{household.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{household.desired_amount}</p>
                    <p>{household.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : householdList.length && !categoryShown.household ? (
          <div className="household" onClick={collapseCategory}>
            <h3>{householdList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        snackList.length &&
        categoryShown.snacks ? (
          <div className="snack" onClick={collapseCategory}>
            <h3>snacks</h3>
            {snackList.map((snack) => (
              <div className="item">
                {/* {console.log(snack)} */}
                <input
                  name={snack.name}
                  type="range"
                  min="0"
                  max={snack.desired_amount}
                  value={cart[snack.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[snack.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{snack.desired_amount}</p>
                    <p>{snack.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{snack.desired_amount}</p>
                    <p>{snack.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : snackList.length && !categoryShown.snacks ? (
          <div className="snack" onClick={collapseCategory}>
            <h3>snacks</h3>
          </div>
        ) : null}
      </div>

      <div className="halfwide list-button" onClick={doneShopping}>
        {" "}
        done shopping
      </div>
    </div>
  );
};

export default GoShop;
