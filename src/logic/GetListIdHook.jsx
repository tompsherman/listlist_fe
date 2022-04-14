import { useEffect, useState } from "react";
import axios from "axios";

const GetListIdHook = (getList) => {
  const [list, setList] = useState([{}, {}]);
  // console.log("getlistIDhook, line 6", getList);

  let currentList = "";
  // console.log("list", list, "currentList", currentList, "get list", getList);

  useEffect(() => {
    axios
      // .get("http://localhost:5505/api/lists/")
      .get(`https://listlesslist.herokuapp.com/api/lists/`)
      .then((response) => setList(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  console.log("in get list hook,", list);

  list.length && getList === "*"
    ? (currentList = list.filter((list) => list.starred_list === getList))
    : list.length && getList.length
    ? (currentList = list.filter((list) => list.type === getList))
    : (currentList = [{ list_id: "" }]);

  // console.log("returned:", currentList.pop());

  return currentList.pop();
};

export default GetListIdHook;
