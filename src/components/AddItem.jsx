import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import GetItemIdHook from "../logic/GetItemIdHook";
import DupeAdd from "./DupeAdd";

const initialState = {
  name: "",
  purchase_unit: "",
  use_unit: "",
  category: "",
  perishable: "",
  time_to_expire: "",
  priority: 5,
  cost: "",
  storage_space: "",
};

const initialFormToggle = {
  name: true,
  category: false,
  cost: false,
  fuse_to_list: false,
};

const AddItem = ({ getList, flipNew, setFlipNew }) => {
  const newGroceryListId = GetListIdHook(getList);
  console.log(newGroceryListId, getList);

  const [itemDatabase, setItemDatabase] = useState([]);
  const [newItem, setNewItem] = useState(initialState);
  const [searchTerm, setSearchTerm] = useState("");
  const [formToggle, setFormToggle] = useState({
    name: true,
    category: false,
    cost: false,
    fuse_to_list: false,
    add_dupe: false,
  });
  const [dupeSend, setDupeSend] = useState("");

  useEffect(() => {
    axios
      // .get(`https://whats-n-da-fridge.herokuapp.com/api/items/${ID_VARIABLE}`)
      .get(`http://localhost:5505/api/items`)
      .then((response) =>
        //console.log("LINE 35,", response.data))
        setItemDatabase(response.data)
      )
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, []);

  const submitHandler = (event) => {
    event.preventDefault();
    axios
      .post(`http://localhost:5505/api/items`, newItem)
      .then(
        (response) => console.log("item response:", response),
        setFormToggle({ ...formToggle, fuse_to_list: true }),
        setSearchTerm(newItem.name),
        setNewItem({ ...newItem, desired_amount: 1 })
      )
      .catch((error) => console.log(error));
  };

  const changeValue = (event) => {
    event.preventDefault();
    setNewItem({ ...newItem, [event.target.name]: event.target.value });
  };

  const subName = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, category: true });
  };

  const subCategory = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, purchase_unit: true });
  };

  const subPurchaseUnit = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, use_unit: true });
  };

  const subUseUnit = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, perishable: true });
  };

  const subPerishable = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, time_to_expire: true });
  };

  const subTimeToExpire = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, storage_space: true });
  };

  const subStorageSpace = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, cost: true });
  };

  const dupeCheck = itemDatabase.filter((item) =>
    item.name.startsWith(newItem.name)
  );

  const item_id = GetItemIdHook(searchTerm);
  // console.log(newGroceryListId);
  let getTheId = "";
  newGroceryListId ? (getTheId = newGroceryListId.list_id) : (getTheId = "");
  const bulletPoint = {
    list_id: getTheId,
    item_id: item_id,
    desired_amount: newItem.desired_amount,
    acquired_amount: 0,
  };

  const submitListItems = (event) => {
    event.preventDefault();
    axios
      .post(`http://localhost:5505/api/list_items`, bulletPoint)
      .then(
        (response) => console.log("item response:", response),
        setNewItem(initialState),
        setFormToggle(initialFormToggle),
        setFlipNew(!flipNew)
      )
      .catch((error) => console.log(error));
  };

  return dupeCheck.length && newItem.name.length ? (
    <div>
      <div className="AddItem">
        <h4>Add Item:</h4>
        <form onSubmit={subName}>
          <input
            name="name"
            type="text"
            value={newItem.name}
            onChange={changeValue}
            placeholder={`enter item name`}
          />
          <button>next</button>
        </form>
        {dupeCheck.map((dupe) => (
          <DupeAdd
            item_id={dupe.item_id}
            list_id={newGroceryListId.list_id}
            dupe={dupe}
            setDupeSend={setDupeSend}
            flipNew={flipNew}
            setFlipNew={setFlipNew}
            setFormToggle={setFormToggle}
            initialFormToggle={initialFormToggle}
            setNewItem={setNewItem}
            initialState={initialState}
          />
        ))}
      </div>
    </div>
  ) : formToggle.fuse_to_list ? (
    <div className="AddItem">
      <h4>
        how many {newItem.purchase_unit} of {newItem.name} do we need?
      </h4>
      <form onSubmit={submitListItems}>
        <input
          name="desired_amount"
          type="number"
          value={newItem.desired_amount}
          onChange={changeValue}
          placeholder={`enter amount to purchase`}
        />
        <button>submit item</button>
      </form>
    </div>
  ) : formToggle.cost ? (
    <div className="AddItem">
      <h4>Cost?</h4>
      <form onSubmit={submitHandler}>
        <input
          name="cost"
          type="number"
          value={newItem.cost}
          onChange={changeValue}
          placeholder={`enter item cost`}
        />
        <button>submit item</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
      <div className="item">
        <p>purchase unit:</p>
        <p>{newItem.purchase_unit}</p>
      </div>
      <div className="item">
        <p>use unit:</p>
        <p>{newItem.use_unit}</p>
      </div>
      <div className="item">
        <p>perishable:</p>
        <p>{newItem.perishable}</p>
      </div>
      <div className="item">
        <p>expires after:</p>
        <p>{newItem.time_to_expire}</p>
      </div>
      <div className="item">
        <p>storage space:</p>
        <p>{newItem.storage_space}</p>
      </div>
    </div>
  ) : formToggle.storage_space ? (
    <div className="AddItem">
      <h4>Storage space</h4>
      <form onSubmit={subStorageSpace}>
        <div onChange={changeValue}>
          <input name="storage_space" type="radio" value="counter" /> counter
          <input name="storage_space" type="radio" value="pantry" /> pantry
          <input name="storage_space" type="radio" value="fridge" /> fridge
        </div>
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
      <div className="item">
        <p>purchase unit:</p>
        <p>{newItem.purchase_unit}</p>
      </div>
      <div className="item">
        <p>use unit:</p>
        <p>{newItem.use_unit}</p>
      </div>
      <div className="item">
        <p>perishable:</p>
        <p>{newItem.perishable}</p>
      </div>
      <div className="item">
        <p>expires after:</p>
        <p>{newItem.time_to_expire}</p>
      </div>
    </div>
  ) : formToggle.time_to_expire ? (
    <div className="AddItem">
      <h4>Expiration</h4>
      <form onSubmit={subTimeToExpire}>
        <input
          name="time_to_expire"
          type="text"
          value={newItem.time_to_expire}
          onChange={changeValue}
          placeholder={`enter items expiration length`}
        />
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
      <div className="item">
        <p>purchase unit:</p>
        <p>{newItem.purchase_unit}</p>
      </div>
      <div className="item">
        <p>use unit:</p>
        <p>{newItem.use_unit}</p>
      </div>
      <div className="item">
        <p>perishable:</p>
        <p>{newItem.perishable}</p>
      </div>
    </div>
  ) : formToggle.perishable ? (
    <div className="AddItem">
      <h4>Perishable?</h4>
      <form onSubmit={subPerishable}>
        <div onChange={changeValue}>
          <input name="perishable" type="radio" value="true" /> yes
          <input name="perishable" type="radio" value="false" /> no
        </div>
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
      <div className="item">
        <p>purchase unit:</p>
        <p>{newItem.purchase_unit}</p>
      </div>
      <div className="item">
        <p>use unit:</p>
        <p>{newItem.use_unit}</p>
      </div>
    </div>
  ) : formToggle.use_unit ? (
    <div className="AddItem">
      <h4>Usage unit:</h4>
      <form onSubmit={subUseUnit}>
        <input
          name="use_unit"
          type="text"
          value={newItem.use_unit}
          onChange={changeValue}
          placeholder={`enter item 's use unit (bag, box, bulb, tbsp, etc)`}
        />
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
      <div className="item">
        <p>purchase unit:</p>
        <p>{newItem.purchase_unit}</p>
      </div>
    </div>
  ) : formToggle.purchase_unit ? (
    <div className="AddItem">
      <h4>Purchase unit:</h4>
      <form onSubmit={subPurchaseUnit}>
        <input
          name="purchase_unit"
          type="text"
          value={newItem.purchase_unit}
          onChange={changeValue}
          placeholder={`enter item 's purchase unit (bag, box, loaf, etc)`}
        />
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
      <div className="item">
        <p>category:</p>
        <p>{newItem.category}</p>
      </div>
    </div>
  ) : formToggle.category ? (
    <div className="AddItem">
      <h4>Category</h4>
      <form onSubmit={subCategory}>
        <input
          name="category"
          type="text"
          value={newItem.category}
          onChange={changeValue}
          placeholder={`enter item category`}
        />
        <button>next</button>
      </form>
      <div className="item">
        <p>name:</p>
        <p>{newItem.name}</p>
      </div>
    </div>
  ) : formToggle.name ? (
    <div className="AddItem">
      <h4>Add Item:</h4>
      <form onSubmit={subName}>
        <input
          name="name"
          type="text"
          value={newItem.name}
          onChange={changeValue}
          placeholder={`enter item name`}
        />
        <button>next</button>
      </form>
    </div>
  ) : (
    <div>somethings wrong</div>
  );
};

export default AddItem;