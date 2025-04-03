import { useEffect, useState } from "react";
import axios from "axios";

const GetListItemsHook = (id) => {
  const [list, setList] = useState([]);
  // console.log("items, line 8", getList);

  useEffect(() => {
    axios
      // .get(`http://localhost:5505/api/lists/${id}`)
      .get(`https://listlist-be.onrender.com/api/lists/${id}`)
      .then((response) => setList(response.data))
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, [id]);

  return list;
};

export default GetListItemsHook;
