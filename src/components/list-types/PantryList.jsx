import React from "react";

const PantryList = ({ array, keyword }) => {
  const keyList = array.filter((item) => item.category === keyword);
  console.log("PANTRYLIST component:::", keyList);

  const testKey = keyList.map((item) => ({
    name: item.name,
    date: item.purchase_date,
    expires: item.time_to_expire,
    use_unit: item.use_unit,
  }));

  console.log("PL TESTKEY:", testKey);
  return (
    <>
      {keyList.length ? (
        <div className={keyword}>
          <h3>{keyList[0].category}</h3>
          <div className="list_container">
            {keyList.map((item) => (
              <div className="item">
                <p>{item.acquired_amount}</p>
                <p>{item.name}</p>
                <p>{item.purchase_date}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default PantryList;
