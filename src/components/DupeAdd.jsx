import { useState } from "react";
import axios from "axios";

const DupeAdd = ({
  flipNew,
  setFlipNew,
  setFormToggle,
  setNewItem,
  initialFormToggle,
  initialState,
  dupe,
  item_id,
  list_id,
}) => {
  const [mode, setMode] = useState("suggestion"); // "suggestion" | "quantity" | "edit"
  const [bullet, setBullet] = useState({
    desired_amount: 1,
    list_id: list_id,
    item_id: item_id,
    acquired_amount: 0,
  });
  const [editItem, setEditItem] = useState({
    name: dupe.name,
    purchase_unit: dupe.purchase_unit || "box",
    use_unit: dupe.use_unit || "self",
    category: dupe.category || "vegetable",
    perishable: dupe.perishable || "true",
    time_to_expire: dupe.time_to_expire || "thirty-six_days",
    cost: dupe.cost || "",
    storage_space: dupe.storage_space || "fridge",
  });

  const handleAddClick = () => {
    setMode("quantity");
  };

  const handleEditClick = () => {
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setMode("suggestion");
  };

  const changeDesiredAmount = (event) => {
    event.preventDefault();
    setBullet({ ...bullet, [event.target.name]: event.target.value });
  };

  const changeEditField = (event) => {
    setEditItem({ ...editItem, [event.target.name]: event.target.value });
  };

  const submitListItems = (event) => {
    event.preventDefault();
    axios
      .post(`https://listlist-db.onrender.com/api/list_items`, bullet)
      .then((response) => console.log("item response:", response))
      .then(() => setNewItem(initialState))
      .then(() => setFormToggle(initialFormToggle))
      .then(() => setFlipNew(!flipNew))
      .catch((error) => console.log(error));
  };

  const submitEditedItem = (event) => {
    event.preventDefault();
    // Update the item in the database
    axios
      .put(`https://listlist-db.onrender.com/api/items/${item_id}`, editItem)
      .then((response) => {
        console.log("Item updated:", response);
        setMode("quantity"); // Go to quantity selection after edit
      })
      .catch((error) => console.log(error));
  };

  if (mode === "suggestion") {
    return (
      <div className="dupe-suggestion">
        <button className="dupe-add-btn" onClick={handleAddClick}>
          add {dupe.name} to list?
        </button>
        <button className="dupe-edit-btn" onClick={handleEditClick}>
          edit
        </button>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="dupe-edit-form">
        <h4>Edit {dupe.name}</h4>
        <form onSubmit={submitEditedItem}>
          <div className="edit-field">
            <label>Name:</label>
            <input name="name" value={editItem.name} onChange={changeEditField} />
          </div>
          <div className="edit-field">
            <label>Category:</label>
            <select name="category" value={editItem.category} onChange={changeEditField}>
              <option value="vegetable">vegetable</option>
              <option value="herbs">herbs</option>
              <option value="fruit">fruit</option>
              <option value="grains">grains</option>
              <option value="meat">meat</option>
              <option value="dairy">dairy</option>
              <option value="household">household</option>
              <option value="drinks">drinks</option>
              <option value="snack">snack</option>
            </select>
          </div>
          <div className="edit-field">
            <label>Purchase unit:</label>
            <select name="purchase_unit" value={editItem.purchase_unit} onChange={changeEditField}>
              <option value="bag">bag</option>
              <option value="box">box</option>
              <option value="bunch">bunch</option>
              <option value="can">can</option>
              <option value="carton">carton</option>
              <option value="jar">jar</option>
              <option value="package">package</option>
              <option value="lb">lb</option>
            </select>
          </div>
          <div className="edit-field">
            <label>Cost ($):</label>
            <input name="cost" type="number" value={editItem.cost} onChange={changeEditField} />
          </div>
          <div className="edit-field">
            <label>Storage:</label>
            <select name="storage_space" value={editItem.storage_space} onChange={changeEditField}>
              <option value="counter">counter</option>
              <option value="pantry">pantry</option>
              <option value="fridge">fridge</option>
              <option value="freezer">freezer</option>
              <option value="closet">closet</option>
            </select>
          </div>
          <div className="edit-buttons">
            <button type="submit">save</button>
            <button type="button" onClick={handleCancelEdit}>cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // mode === "quantity"
  // Use editItem.name if we came from edit mode (has been modified), otherwise use dupe.name
  const displayName = editItem.name !== dupe.name ? editItem.name : dupe.name;
  return (
    <div className="dupe-form">
      <h4>how many {displayName}?</h4>
      <form onSubmit={submitListItems}>
        <input
          name="desired_amount"
          type="number"
          value={bullet.desired_amount}
          onChange={changeDesiredAmount}
          placeholder={`enter amount`}
        />
        <button>submit</button>
      </form>
    </div>
  );
};

export default DupeAdd;
