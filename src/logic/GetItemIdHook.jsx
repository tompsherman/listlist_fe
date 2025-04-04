import { useEffect, useState } from "react";
import axios from "axios";

const GetItemIdHook = (getItem) => {
  const [items, setItems] = useState([]);
  console.log("items, line 8", getItem, items);

  // console.log("!!!!!!!!!!!!!!!", items);

  useEffect(() => {
    axios
      // .get("http://localhost:5505/api/items/")
      .get("https://listlist-db.onrender.com/api/items/")
      .then((response) => setItems(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  let currentItem = items.find((items) => items.name === getItem);
  console.log("items, line 20", getItem, items, currentItem);

  let send_id = "";
  currentItem
    ? (send_id = currentItem.item_id)
    : (send_id = `${getItem} is not found in item database`);

  // console.log("send_id,", send_id);
  return send_id;
};

export default GetItemIdHook;
