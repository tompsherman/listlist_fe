import React from "react";

const GeneralList = ({ array, keyword }) => {
  const keyList = array.filter((item) => item.category === keyword);

  return (
    <>
      {keyList.length ? (
        <div className={keyword}>
          <h3>{keyList[0].category}</h3>
          <div className="list_container">
            {keyList.map((item) => (
              <div className="item">
                <p>{item.desired_amount}</p>
                <p>{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GeneralList;
