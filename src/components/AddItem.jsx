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
  storage_size: "",
  image_url: "",
  has_substitutes: "no",
  substitutes: "",
  brand_matters: "no",
  brand: "",
  breaks_down: "no",
  breaks_into_1: "",
  breaks_into_2: "",
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
      .get(`https://listlist-db.onrender.com/api/items/`)
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
      .post(`https://listlist-db.onrender.com/api/items`, newItem)
      .then((response) => console.log("item response:", response))
      .then(() => setFormToggle({ ...formToggle, add_to_list_now: true }))
      .catch((error) => console.log(error));
  };

  const submitToDbOnly = (event) => {
    event.preventDefault();
    axios
      .post(`https://listlist-db.onrender.com/api/items`, newItem)
      .then((response) => {
        console.log("Item added to DB only:", response);
        setNewItem(initialState);
        setFormToggle(initialFormToggle);
        setFlipNew(!flipNew);
      })
      .catch((error) => console.log(error));
  };

  const proceedToQuantity = () => {
    setSearchTerm(newItem.name);
    setNewItem({ ...newItem, desired_amount: 1 });
    setFormToggle({ ...formToggle, add_to_list_now: false, fuse_to_list: true });
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

  const handleCancel = () => {
    setNewItem(initialState);
    setFormToggle(initialFormToggle);
    setFlipNew(false);
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
    // If not perishable, auto-set expiration to "never" and skip to storage_space
    if (newItem.perishable === "false") {
      setNewItem({ ...newItem, time_to_expire: "never" });
      setFormToggle({ ...formToggle, storage_space: true });
    } else {
      setFormToggle({ ...formToggle, time_to_expire: true });
    }
  };

  const subTimeToExpire = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, storage_space: true });
  };

  const subStorageSpace = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, storage_size: true });
  };

  const subStorageSize = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, image_url: true });
  };

  const subImageUrl = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, has_substitutes: true });
  };

  const subHasSubstitutes = (event) => {
    event.preventDefault();
    if (newItem.has_substitutes === "yes") {
      setFormToggle({ ...formToggle, substitutes: true });
    } else {
      setFormToggle({ ...formToggle, brand_matters: true });
    }
  };

  const subSubstitutes = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, brand_matters: true });
  };

  const subBrandMatters = (event) => {
    event.preventDefault();
    if (newItem.brand_matters === "yes") {
      setFormToggle({ ...formToggle, brand: true });
    } else {
      setFormToggle({ ...formToggle, breaks_down: true });
    }
  };

  const subBrand = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, breaks_down: true });
  };

  const subBreaksDown = (event) => {
    event.preventDefault();
    if (newItem.breaks_down === "yes") {
      setFormToggle({ ...formToggle, breaks_into: true });
    } else {
      setFormToggle({ ...formToggle, cost: true });
    }
  };

  const subBreaksInto = (event) => {
    event.preventDefault();
    setFormToggle({ ...formToggle, cost: true });
  };

  // Back button handlers
  const backToName = () => {
    setFormToggle({ ...initialFormToggle, name: true });
  };

  const backToCategory = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true });
  };

  const backToPurchaseUnit = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true });
  };

  const backToUseUnit = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true });
  };

  const backToPerishable = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true });
  };

  const backToTimeToExpire = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true });
  };

  const backToStorageSpace = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true });
  };

  const backToStorageSize = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true });
  };

  const backToImageUrl = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true });
  };

  const backToHasSubstitutes = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true });
  };

  const backToSubstitutes = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true, substitutes: true });
  };

  const backToBrandMatters = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true, brand_matters: true });
  };

  const backToBrand = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true, brand_matters: true, brand: true });
  };

  const backToBreaksDown = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true, brand_matters: true, breaks_down: true });
  };

  const backToBreaksInto = () => {
    setFormToggle({ ...initialFormToggle, name: true, category: true, purchase_unit: true, use_unit: true, perishable: true, time_to_expire: true, storage_space: true, storage_size: true, image_url: true, has_substitutes: true, brand_matters: true, breaks_down: true, breaks_into: true });
  };

  const dupeCheck = itemDatabase.filter((item) =>
    item.name.toLowerCase().startsWith(newItem.name.toLowerCase())
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
      .post(`https://listlist-db.onrender.com/api/list_items`, bulletPoint)

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
          <button type="button" className="cancel-btn" onClick={handleCancel}>cancel</button>
        </form>
        {dupeCheck.map((dupe) => (
          <DupeAdd
            key={dupe.item_id}
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
  ) : formToggle.add_to_list_now ? (
    <div className="AddItem">
      <h4>Add to list now?</h4>
      <div className="add-to-list-options">
        <button className="yes-btn" onClick={proceedToQuantity}>yes</button>
        <button className="no-btn" onClick={submitToDbOnly}>no, save for later</button>
      </div>
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
        <button type="button" className="back-btn" onClick={backToBreaksDown}>back</button>
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
        <p>storage space:</p>
        <p>{newItem.storage_space}</p>
      </div>
      {newItem.storage_size && (
        <div className="item">
          <p>storage size:</p>
          <p>{newItem.storage_size}</p>
        </div>
      )}
    </div>
  ) : formToggle.breaks_into ? (
    <div className="AddItem">
      <h4>What does it break into?</h4>
      <form onSubmit={subBreaksInto}>
        <input
          name="breaks_into_1"
          type="text"
          value={newItem.breaks_into_1}
          onChange={changeValue}
          placeholder="component 1"
        />
        <input
          name="breaks_into_2"
          type="text"
          value={newItem.breaks_into_2}
          onChange={changeValue}
          placeholder="component 2"
        />
        <button type="button" className="back-btn" onClick={backToBreaksDown}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.breaks_down ? (
    <div className="AddItem">
      <h4>Breaks down into components?</h4>
      <form onSubmit={subBreaksDown}>
        <select name="breaks_down" value={newItem.breaks_down} onChange={changeValue}>
          <option value="no">no</option>
          <option value="yes">yes</option>
        </select>
        <button type="button" className="back-btn" onClick={backToBrandMatters}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.brand ? (
    <div className="AddItem">
      <h4>What brand?</h4>
      <form onSubmit={subBrand}>
        <input
          name="brand"
          type="text"
          value={newItem.brand}
          onChange={changeValue}
          placeholder="enter brand name"
        />
        <button type="button" className="back-btn" onClick={backToBrandMatters}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.brand_matters ? (
    <div className="AddItem">
      <h4>Specific brand matters?</h4>
      <form onSubmit={subBrandMatters}>
        <select name="brand_matters" value={newItem.brand_matters} onChange={changeValue}>
          <option value="no">no</option>
          <option value="yes">yes</option>
        </select>
        <button type="button" className="back-btn" onClick={backToHasSubstitutes}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.substitutes ? (
    <div className="AddItem">
      <h4>What substitutes?</h4>
      <form onSubmit={subSubstitutes}>
        <input
          name="substitutes"
          type="text"
          value={newItem.substitutes}
          onChange={changeValue}
          placeholder="enter substitute item"
        />
        <button type="button" className="back-btn" onClick={backToHasSubstitutes}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.has_substitutes ? (
    <div className="AddItem">
      <h4>Has substitutes?</h4>
      <form onSubmit={subHasSubstitutes}>
        <select name="has_substitutes" value={newItem.has_substitutes} onChange={changeValue}>
          <option value="no">no</option>
          <option value="yes">yes</option>
        </select>
        <button type="button" className="back-btn" onClick={backToImageUrl}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.image_url ? (
    <div className="AddItem">
      <h4>Image URL (optional)</h4>
      <form onSubmit={subImageUrl}>
        <input
          name="image_url"
          type="text"
          value={newItem.image_url}
          onChange={changeValue}
          placeholder="paste image URL"
        />
        <button type="button" className="back-btn" onClick={backToStorageSize}>back</button>
        <button>next</button>
      </form>
    </div>
  ) : formToggle.storage_size ? (
    <div className="AddItem">
      <h4>Storage size?</h4>
      <form onSubmit={subStorageSize}>
        <select name="storage_size" value={newItem.storage_size} onChange={changeValue}>
          <option value="">-- select --</option>
          <option value="pint">pint</option>
          <option value="quart">quart</option>
          <option value="half_gallon">1/2 gallon</option>
          <option value="gallon">gallon</option>
        </select>
        <button type="button" className="back-btn" onClick={backToStorageSpace}>back</button>
        <button>next</button>
      </form>
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
        <button type="button" className="back-btn" onClick={backToTimeToExpire}>back</button>
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
        <button type="button" className="back-btn" onClick={backToPerishable}>back</button>
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
        <button type="button" className="back-btn" onClick={backToUseUnit}>back</button>
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
        <button type="button" className="back-btn" onClick={backToPurchaseUnit}>back</button>
        <button>next</button>
        <button type="button" className="cancel-btn" onClick={handleCancel}>cancel</button>
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
        <button type="button" className="back-btn" onClick={backToCategory}>back</button>
        <button>next</button>
        <button type="button" className="cancel-btn" onClick={handleCancel}>cancel</button>
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
        <button type="button" className="back-btn" onClick={backToName}>back</button>
        <button>next</button>
        <button type="button" className="cancel-btn" onClick={handleCancel}>cancel</button>
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
        <button type="button" className="cancel-btn" onClick={handleCancel}>cancel</button>
      </form>
    </div>
  ) : (
    <div>somethings wrong</div>
  );
};

export default AddItem;
