import { useState } from "react";
import AddItem from "../components/AddItem";
import List from "../components/List";

const Dashboard = ({ getList }) => {
  const [flipNew, setFlipNew] = useState(false);
  console.log(getList);
  const flipper = () => {
    setFlipNew(!flipNew);
  };

  return (
    <div className="Dashboard">
      {flipNew ? (
        <AddItem getList={getList} flipNew={flipNew} setFlipNew={setFlipNew} />
      ) : (
        <div className="flex-row fullwide">
          <h3 className="halfwide list-button" onClick={flipper}>
            add item
          </h3>
          <div className="halfwide list-button">go shopping</div>
        </div>
      )}
      <List getList={getList} flipNew={flipNew} />
    </div>
  );
};

export default Dashboard;
