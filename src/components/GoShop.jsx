import React, { useState, useEffect } from "react";
import GetListIdHook from "../logic/GetListIdHook";
import GetListItemsHook from "../logic/GetListItemsHook";
import axios from "axios";
import ShoppingList from "./list-types/ShoppingList";

const GoShop = ({ getList, currentList, setShopping }) => {
  // console.log("goshop current list:", getList, "current list", currentList);
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

  const futureList = GetListIdHook(getList);
  console.log("futurlist then getlist", futureList, getList);
  const shopList = GetListItemsHook(currentList.list_id);

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

  const getPantryList = GetListIdHook("pantry");
  // const getGroceryList = GetListIdHook("grocery");

  const doneShopping = (event) => {
    let panArr = [];
    let grocArr = [];
    const currentTime = new Date().toDateString().split(" ");

    shopList.forEach((item) => {
      if (cart[item.name].fulfilled === 1) {
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          purchase_date: `${currentTime[1]} ${currentTime[2]}`,
          purchase_year: `${currentTime[3]}`,
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
          purchase_date: `${currentTime[1]} ${currentTime[2]}`,
          purchase_year: `${currentTime[3]}`,
          desired_amount: cart[item.name].desired_amount,
          list_id: futureList.list_id + 1,
        });
      } else {
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          purchase_date: `${currentTime[1]} ${currentTime[2]}`,
          purchase_year: `${currentTime[3]}`,
          desired_amount: 0,
          list_id: getPantryList.list_id,
          amount_left:
            cart[item.name].desired_amount * cart[item.name].fulfilled,
        });
        panArr.push({
          name: item.name,
          item_id: item.item_id,
          acquired_amount: 0,
          purchase_date: `${currentTime[1]} ${currentTime[2]}`,
          purchase_year: `${currentTime[3]}`,
          desired_amount:
            cart[item.name].desired_amount -
            cart[item.name].desired_amount * cart[item.name].fulfilled,
          list_id: futureList.list_id + 1,
        });
      }
      return panArr && grocArr;
    });
    console.log(
      "panArr outside the function:",
      panArr,
      "futurelist",
      futureList,
      "currentList",
      currentList
    );
    // event.preventDefault();
    axios
      // .post(`http://localhost:5505/api/list_items/bulk_add`, panArr)
      .post(
        `https://listlesslist.herokuapp.com/api/list_items/bulk_add`,
        panArr
      )

      .then((response) => console.log("item response:", response))
      .catch((error) => console.log(error));
    // setPantry(panArr);
    // setGrocery(grocArr);
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
  const snackList = shopList.filter((item) => item.category === "snack");
  const drinksList = shopList.filter((item) => item.category === "drinks");

  const collapseCategory = (event) => {
    setCategoryShown({
      ...categoryShown,
      [event.target.innerText]: !categoryShown[event.target.innerText],
    });
    // console.log(event.target.innerText);
  };

  const addToCart = (event) => {
    // console.log(event);
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
          <>
            <ShoppingList
              array={shopList}
              keyword={"vegetable"}
              collapseCategory={collapseCategory}
              cart={cart}
              addToCart={addToCart}
            />
          </>
        ) : vegetableList.length && !categoryShown.vegetable ? (
          <div className="vegetable" onClick={collapseCategory}>
            <h3>{vegetableList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length && herbsList.length && categoryShown.herbs ? (
          <ShoppingList
            array={shopList}
            keyword={"herbs"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : herbsList.length && !categoryShown.herbs ? (
          <div className="herbs" onClick={collapseCategory}>
            <h3>{herbsList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length && fruitList.length && categoryShown.fruit ? (
          <ShoppingList
            array={shopList}
            keyword={"fruit"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : fruitList.length && !categoryShown.fruit ? (
          <div className="fruit" onClick={collapseCategory}>
            <h3>{fruitList[0].category}</h3>
          </div>
        ) : null}

        {Object.keys(cart).length &&
        grainsList.length &&
        categoryShown.grains ? (
          <ShoppingList
            array={shopList}
            keyword={"grains"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : grainsList.length && !categoryShown.grains ? (
          <div className="grains" onClick={collapseCategory}>
            <h3>{grainsList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length && meatList.length && categoryShown.meat ? (
          <ShoppingList
            array={shopList}
            keyword={"meat"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : meatList.length && !categoryShown.meat ? (
          <div className="meat" onClick={collapseCategory}>
            <h3>{meatList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length && dairyList.length && categoryShown.dairy ? (
          <ShoppingList
            array={shopList}
            keyword={"dairy"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : dairyList.length && !categoryShown.dairy ? (
          <div className="dairy" onClick={collapseCategory}>
            <h3>{dairyList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        drinksList.length &&
        categoryShown.drinks ? (
          <ShoppingList
            array={shopList}
            keyword={"drinks"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : drinksList.length && !categoryShown.drinks ? (
          <div className="drinks" onClick={collapseCategory}>
            <h3>{drinksList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        householdList.length &&
        categoryShown.household ? (
          <ShoppingList
            array={shopList}
            keyword={"household"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
        ) : householdList.length && !categoryShown.household ? (
          <div className="household" onClick={collapseCategory}>
            <h3>{householdList[0].category}</h3>
          </div>
        ) : null}
        {Object.keys(cart).length &&
        snackList.length &&
        categoryShown.snacks ? (
          <ShoppingList
            array={shopList}
            keyword={"snack"}
            collapseCategory={collapseCategory}
            cart={cart}
            addToCart={addToCart}
          />
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
