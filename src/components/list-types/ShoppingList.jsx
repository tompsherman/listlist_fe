import React from "react";

const ShoppingList = ({
  array,
  keyword,
  collapseCategory,
  cart,
  addToCart,
}) => {
  const keyList = array.filter((item) => item.category === keyword);
  // console.log("cart in list component", cart);
  return (
    <>
      {keyList.length ? (
        <div className={keyword} onClick={collapseCategory}>
          <h3>{keyList[0].category}</h3>
          <div className="list_container">
            {keyList.map((item) => (
              <div className="item">
                <input
                  name={item.name}
                  type="range"
                  min="0"
                  max={item.desired_amount}
                  value={cart[item.name].acquired_amount}
                  onChange={addToCart}
                />

                {cart[item.name].fulfilled === 1 ? (
                  <div className="flex-row strikethrough">
                    <p>{item.desired_amount}</p>
                    <p>{item.name}</p>
                  </div>
                ) : (
                  <div className="flex-row">
                    <p>{item.desired_amount}</p>
                    <p>{item.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ShoppingList;
