import AddItem from "../components/AddItem";
import List from "../components/List";

const Dashboard = () => {
  let opened = true;
  const expand = (event) => {
    opened = !opened;
    console.log("opened", opened);
  };

  return (
    <div className="Dashboard">
      <h1 className="headline">Welcome to ListList!</h1>
      <List />
      <div onClick={expand}>
        <AddItem opened={opened} />
      </div>
      <div>go shopping! button</div>
    </div>
  );
};

export default Dashboard;
