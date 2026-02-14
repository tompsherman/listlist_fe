import { useState } from "react";
import AddItem from "../components/AddItem";
import List from "../components/List";
import GoShop from "../components/GoShop";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";

const Dashboard = ({ getList }) => {
  const [list, setList] = useState([]);
  const [flipNew, setFlipNew] = useState(false);
  const [shopping, setShopping] = useState(false);

  // console.log("get list:", getList);
  //
  // need to figure out a way to useEffect to update
  // the current list after ending the shopping trip
  // (will fix the edge bug of cannot go shopping with a new list unless force refreshed)
  const currentList = GetListIdHook(getList);
  console.log("DASHBOARD current list::", currentList);

  const flipper = () => {
    setFlipNew(!flipNew);
  };

  const currentTime = new Date().toDateString().split(" ");

  const goShopping = (event) => {
    event.preventDefault();
    const newGroceryList = {
      created_timestamp: `${currentTime[1]} ${currentTime[2]} ${currentTime[3]}`,
      list_open: true,
      type: "grocery",
      starred: "*",
    };
    console.log("GO SHOPPING TRIGGERED:", newGroceryList);
    axios
      // .post(`http://localhost:5505/api/lists/`, newGroceryList)
      .post(`https://listlist-db.onrender.com/api/lists/`, newGroceryList)
      .then(
        (response) => console.log("item response:", response),
        setShopping(true)
      )
      .then(() => setShopping(true))
      .catch((error) => console.log(error));
  };
  return (
    <div className="Dashboard">
      {shopping ? null : flipNew ? (
        <AddItem
          list={list}
          setList={setList}
          getList={getList}
          flipNew={flipNew}
          setFlipNew={setFlipNew}
          flipper={flipper}
        />
      ) : getList === "pantry" ? null : (
        <div className="flex-row fullwide">
          <h3 className="halfwide list-button" onClick={flipper}>
            add item
          </h3>
          <h3 className="halfwide list-button" onClick={goShopping}>
            Go Shop
          </h3>
        </div>
      )}
      {shopping ? (
        <>
          {console.log(
            "DASHBOARD GOSHOP, currentList:",
            currentList,
            "getList",
            getList
          )}

          <GoShop
            getList={getList}
            setList={setList}
            shopping={shopping}
            setShopping={setShopping}
            currentList={currentList}
          />
        </>
      ) : (
        <>
          <List currentList={currentList} getList={getList} flipNew={flipNew} onAddItem={flipper} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
