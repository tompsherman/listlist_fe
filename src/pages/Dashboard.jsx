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

  console.log("get list:", getList);

  const currentList = GetListIdHook(getList);
  console.log("current list::", currentList);

  const flipper = () => {
    setFlipNew(!flipNew);
  };
  const goShopping = (event) => {
    event.preventDefault();
    const newGroceryList = {
      created_timestamp: event.timeStamp,
      list_open: true,
      type: "grocery",
      purchased_timestamp: "",
      starred_list: "*",
    };
    console.log("GoShopping triggered:", newGroceryList);
    axios
      .post(`http://localhost:5505/api/lists/`, newGroceryList)
      .then(
        (response) => console.log("item response:", response),
        setShopping(true)
      )
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
      ) : (
        <div className="flex-row fullwide">
          <h3 className="halfwide list-button" onClick={flipper}>
            add item
          </h3>
          <div className="halfwide list-button" onClick={goShopping}>
            Go Shop
          </div>
        </div>
      )}
      {shopping ? (
        <GoShop
          getList={getList}
          setList={setList}
          shopping={shopping}
          setShopping={setShopping}
          currentList={currentList}
        />
      ) : (
        <List currentList={currentList} getList={getList} flipNew={flipNew} />
      )}
    </div>
  );
};

export default Dashboard;
