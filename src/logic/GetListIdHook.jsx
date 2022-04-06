import { useEffect, useState } from "react";
import axios from "axios";

const GetListIdHook = (getList) => {
  const [list, setList] = useState([]);
  // console.log("items, line 8", getList);

  let currentList = "";

  useEffect(() => {
    axios
      // .get(`https://whats-n-da-fridge.herokuapp.com/api/lists/`)
      .get("http://localhost:5505/api/lists/")
      .then((response) => setList(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  // console.log("line 17", currentList, getList);

  list.length && getList === "*"
    ? (currentList = list.find((list) => list.starred_list === getList))
    : list.length && getList.length
    ? (currentList = list.find((list) => list.type === getList))
    : (currentList = [{ list_id: "" }]);

  return currentList;
};

export default GetListIdHook;
