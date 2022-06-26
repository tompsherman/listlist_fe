import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import GetItemIdHook from "../logic/GetItemIdHook";
import DupeAdd from "./DupeAdd";

const initialState = {
  name: "",
  purchase_unit: "box",
  use_unit: "self",
  category: "vegetable",
  perishable: "true",
  time_to_expire: "thirty-six_days",
  priority: 5,
  cost: "",
  storage_space: "fridge",
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
  console.log(GetListIdHook(getList));

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

  console.log(
    "SEARCH TERM",
    searchTerm,
    "ITEM DATABASE",
    itemDatabase,
    "FORM TOGGLE.FUSETOLIST",
    formToggle.fuse_to_list,
    "NEW ITEM",
    newItem
  );

  useEffect(() => {
    axios
      .get(`https://listlesslist.herokuapp.com/api/items/`)
      // .get(`http://localhost:5505/api/items`)
      .then((response) =>
        //console.log("LINE 35,", response.data))
        setItemDatabase(response.data)
      )
      // .then(console.log("GET list", list))
      .catch((error) => console.log(error.message, error.stack));
  }, [formToggle.fuse_to_list, searchTerm]);

  const submitHandler = (event) => {
    console.log("ITEM ADDED TO DATABASE???", newItem);
    event.preventDefault();
    axios
      // .post(`http://localhost:5505/api/items`, newItem)
      .post(`https://listlesslist.herokuapp.com/api/items`, newItem)

      .then((response) => console.log("item response:", response))
      .then(() => setFormToggle({ ...formToggle, fuse_to_list: true }))
      .then(() => setSearchTerm(newItem.name))
      .then(() => setNewItem({ ...newItem, desired_amount: 1 }))
      .catch((error) => console.log(error));
  };

  const changeValue = (event) => {
    console.log(
      "hello from change value:",
      event,
      "also from new item",
      newItem
    );
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

  console.log(
    "bulletpoint",
    bulletPoint,
    "newGroceryList",
    newGroceryListId,
    "Get the ID",
    getTheId,
    "item_iD",
    item_id
  );
  console.log("dupecheck", dupeCheck, "itemdatabase", itemDatabase);

  const submitListItems = (event) => {
    event.preventDefault();
    axios
      // .post(`http://localhost:5505/api/list_items`, bulletPoint)
      .post(`https://listlesslist.herokuapp.com/api/list_items`, bulletPoint)

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
            ref={(ref) => ref && ref.focus()}
            onFocus={(e) =>
              e.currentTarget.setSelectionRange(
                e.currentTarget.value.length,
                e.currentTarget.value.length
              )
            }
          />
          <button>next</button>
        </form>
        {dupeCheck.map((dupe) => (
          <DupeAdd
            item_id={dupe.item_id}
            list_id={newGroceryListId.list_id}
            dupe={dupe}
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
        <select name="storage_space" onChange={changeValue}>
          <option value="counter">counter</option>
          <option value="pantry">pantry</option>
          <option selected value="fridge">
            fridge
          </option>
          <option value="freezer">freezer</option>
          <option value="closet">closet</option>
        </select>
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
        <select name="time_to_expire" onChange={changeValue}>
          <option value="three_days">3 days</option>
          <option value="six_days">6 days</option>
          <option selected value="nine_days">
            1 week (9 days)
          </option>
          <option value="eighteen_days">2 weeks (18 days)</option>
          <option value="thirty-six_days">1 month (36 days)</option>
          <option value="seventy-three_days">1 season (73 days)</option>
          <option value="three-hundred-sixty-five_days">
            1 year (365 days)
          </option>
          <option value="never">never</option>
        </select>
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
        <select name="perishable" onChange={changeValue}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
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
        <select name="use_unit" onChange={changeValue}>
          <option value="bag">bag</option>
          <option value="box">box</option>
          <option value="can">can</option>
          <option value="cup">cup</option>
          <option value="handful">handful</option>
          <option value="package">package</option>
          <option value="scoop">scoop</option>
          <option value="tbsp">tbsp</option>
          <option value="tsp">tsp</option>
          <option value="slice">slice</option>
          <option selected value="self">
            one of itself (ex. apple)
          </option>
        </select>
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
        <select name="purchase_unit" onChange={changeValue}>
          <option value="bag">bag</option>
          <option selected value="box">
            box
          </option>
          <option value="bunch">bunch</option>
          <option value="can">can</option>
          <option value="carton">carton</option>
          <option value="jar">jar</option>
          <option value="package">package</option>
          <option value="lb">lb</option>
        </select>
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
        <select name="category" onChange={changeValue}>
          <option selected value="vegetable">
            vegetable
          </option>
          <option value="herbs">herbs</option>
          <option value="fruit">fruit</option>
          <option value="grains">grains</option>
          <option value="meat">meat</option>
          <option value="dairy">dairy</option>
          <option value="household">household</option>
          <option value="drinks">drinks</option>
          <option value="snack">snack</option>
        </select>
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
          value={newItem.name.toLowerCase()}
          onChange={changeValue}
          placeholder={`enter item name`}
          ref={(ref) => ref && ref.focus()}
          onFocus={(e) =>
            e.currentTarget.setSelectionRange(
              e.currentTarget.value.length,
              e.currentTarget.value.length
            )
          }
        />
        <button>next</button>
      </form>
    </div>
  ) : (
    <div>somethings wrong</div>
  );
};

export default AddItem;
