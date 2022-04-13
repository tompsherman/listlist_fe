import { useEffect } from "react";
import axios from "axios";

const AxiosGet = ({ route, setter }) => {
  useEffect(() => {
    axios
      // .get(`http://localhost:5505/api/${route}`)
      .get(`https://listlesslist.heroku.com/api/${route}`)
      .then((response) =>
        //console.log("LINE 35,", response.data))
        setter(response.data)
      )
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);
};

export default AxiosGet;
