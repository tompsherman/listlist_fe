import { useState, useEffect } from "react";
import axios from "axios";
import CreatableSelect from "./CreatableSelect";
import useOptions from "../hooks/useOptions";
import SubstituteSelector from "./SubstituteSelector";

const CATEGORY_COLORS = {
  vegetable: "#228B22",
  herbs: "#8B7355",
  fruit: "#9ACD32",
  grains: "#DAA520",
  meat: "#F08080",
  dairy: "#FFFFFF",
  household: "#ADD8E6",
  drinks: "#BDB76B",
  snack: "#FF6347",
};

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
  const { options, addOption } = useOptions();
  const [mode, setMode] = useState("row"); // "row" | "card" | "quantity" | "edit" | "delete"
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
    use_per_unit: dupe.use_per_unit || 1,
    category: dupe.category || "vegetable",
    perishable: dupe.perishable || "true",
    time_to_expire: dupe.time_to_expire || "thirty-six_days",
    cost: dupe.cost || "",
    storage_space: dupe.storage_space || "fridge",
    storage_size: dupe.storage_size || "",
    image_url: dupe.image_url || "",
    has_substitutes: dupe.has_substitutes || "no",
    substitutes: Array.isArray(dupe.substitutes) ? dupe.substitutes : (dupe.substitutes ? [{ name: dupe.substitutes }] : []),
    brand_matters: dupe.brand_matters || "no",
    brand: dupe.brand || "",
    breaks_down: dupe.breaks_down || "no",
    breaks_into_1: dupe.breaks_into_1 || "",
    breaks_into_2: dupe.breaks_into_2 || "",
  });

  // Reset when dupe/item_id changes
  useEffect(() => {
    setEditItem({
      name: dupe.name,
      purchase_unit: dupe.purchase_unit || "box",
      use_unit: dupe.use_unit || "self",
      use_per_unit: dupe.use_per_unit || 1,
      category: dupe.category || "vegetable",
      perishable: dupe.perishable || "true",
      time_to_expire: dupe.time_to_expire || "thirty-six_days",
      cost: dupe.cost || "",
      storage_space: dupe.storage_space || "fridge",
      storage_size: dupe.storage_size || "",
      image_url: dupe.image_url || "",
      has_substitutes: dupe.has_substitutes || "no",
      substitutes: Array.isArray(dupe.substitutes) ? dupe.substitutes : (dupe.substitutes ? [{ name: dupe.substitutes }] : []),
      brand_matters: dupe.brand_matters || "no",
      brand: dupe.brand || "",
      breaks_down: dupe.breaks_down || "no",
      breaks_into_1: dupe.breaks_into_1 || "",
      breaks_into_2: dupe.breaks_into_2 || "",
    });
    setBullet({
      desired_amount: 1,
      list_id: list_id,
      item_id: item_id,
      acquired_amount: 0,
    });
    setMode("row");
  }, [dupe.item_id, item_id, list_id, dupe]);

  const categoryColor = CATEGORY_COLORS[dupe.category] || "#f5f5f5";

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
    axios
      .put(`https://listlist-db.onrender.com/api/items/${item_id}`, editItem)
      .then((response) => {
        console.log("Item updated:", response);
        setMode("quantity");
      })
      .catch((error) => {
        console.error("Error updating item:", error);
      });
  };

  const handleDeleteFromView = () => {
    // Just close the suggestion (remove from current view, not from database)
    setMode("row");
    // Could hide this item from the list, but for now just reset
  };

  const handleDeleteFromPod = () => {
    // Delete item from the pod's item database
    axios
      .delete(`https://listlist-db.onrender.com/api/items/${item_id}`)
      .then((response) => {
        console.log("Item deleted from pod:", response);
        setNewItem(initialState);
        setFormToggle(initialFormToggle);
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
      });
  };

  // ROW VIEW: [item name] | [+] | [edit] | [x]
  if (mode === "row") {
    return (
      <div className="item-row" style={{ backgroundColor: categoryColor }}>
        <span className="item-row-name" onClick={() => setMode("card")}>
          {dupe.name}
        </span>
        <button className="item-row-btn add-btn" onClick={() => setMode("quantity")}>+</button>
        <button className="item-row-btn edit-btn" onClick={() => setMode("edit")}>edit</button>
        <button className="item-row-btn delete-btn" onClick={() => setMode("delete")}>✕</button>
      </div>
    );
  }

  // CARD VIEW: Full info with "add to list" and "edit" options
  if (mode === "card") {
    return (
      <div className="item-card-full" style={{ borderColor: categoryColor }}>
        <h4>{dupe.name}</h4>
        <div className="item-card-info">
          <p><strong>Category:</strong> {dupe.category}</p>
          <p><strong>Purchase unit:</strong> {dupe.purchase_unit}</p>
          <p><strong>Use unit:</strong> {dupe.use_unit || "self"}</p>
          <p><strong>Storage:</strong> {dupe.storage_space || "fridge"}</p>
          {dupe.cost && <p><strong>Cost:</strong> ${dupe.cost}</p>}
          <p><strong>Expires:</strong> {dupe.time_to_expire}</p>
        </div>
        <div className="item-card-actions">
          <button className="card-action-btn" onClick={() => setMode("quantity")}>add to list</button>
          <button className="card-action-btn" onClick={() => setMode("edit")}>edit</button>
          <button className="card-action-btn cancel" onClick={() => setMode("row")}>back</button>
        </div>
      </div>
    );
  }

  // QUANTITY VIEW: How many?
  if (mode === "quantity") {
    const displayName = editItem.name !== dupe.name ? editItem.name : dupe.name;
    return (
      <div className="item-quantity-form" style={{ borderColor: categoryColor }}>
        <h4>How many {displayName}?</h4>
        <form onSubmit={submitListItems}>
          <input
            name="desired_amount"
            type="number"
            value={bullet.desired_amount}
            onChange={changeDesiredAmount}
            min="1"
          />
          <div className="quantity-actions">
            <button type="submit">add to list</button>
            <button type="button" onClick={() => setMode("row")}>cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // EDIT VIEW: Editable card
  if (mode === "edit") {
    return (
      <div className="item-edit-form" style={{ borderColor: categoryColor }}>
        <h4>Edit {dupe.name}</h4>
        <form onSubmit={submitEditedItem}>
          <div className="edit-field">
            <label>Name:</label>
            <input name="name" value={editItem.name} onChange={changeEditField} />
          </div>
          <div className="edit-field">
            <label>Category:</label>
            <CreatableSelect
              name="category"
              value={editItem.category}
              onChange={changeEditField}
              options={options.category}
              onAddOption={addOption}
            />
          </div>
          <div className="edit-field">
            <label>Purchase unit:</label>
            <CreatableSelect
              name="purchase_unit"
              value={editItem.purchase_unit}
              onChange={changeEditField}
              options={options.purchase_unit}
              onAddOption={addOption}
            />
          </div>
          <div className="edit-field">
            <label>Use unit:</label>
            <CreatableSelect
              name="use_unit"
              value={editItem.use_unit}
              onChange={changeEditField}
              options={[
                ...options.use_unit.filter(o => o !== "self"),
                { value: "self", label: "one of itself" }
              ]}
              onAddOption={addOption}
            />
          </div>
          <div className="edit-field">
            <label>Uses per unit:</label>
            <input name="use_per_unit" type="number" min="1" value={editItem.use_per_unit} onChange={changeEditField} />
          </div>
          <div className="edit-field">
            <label>Cost ($):</label>
            <input name="cost" type="number" value={editItem.cost} onChange={changeEditField} />
          </div>
          {editItem.cost && editItem.use_per_unit > 0 && (
            <div className="edit-field calculated">
              <label>Cost per {editItem.use_unit === "self" ? editItem.name : editItem.use_unit}:</label>
              <span className="calculated-value">${(parseFloat(editItem.cost) / parseInt(editItem.use_per_unit)).toFixed(2)}</span>
            </div>
          )}
          <div className="edit-field">
            <label>Storage:</label>
            <CreatableSelect
              name="storage_space"
              value={editItem.storage_space}
              onChange={changeEditField}
              options={options.storage_space}
              onAddOption={addOption}
            />
          </div>
          <div className="edit-field">
            <label>Size:</label>
            <CreatableSelect
              name="storage_size"
              value={editItem.storage_size}
              onChange={changeEditField}
              options={[
                { value: "pint", label: "pint" },
                { value: "quart", label: "quart" },
                { value: "half_gallon", label: "1/2 gallon" },
                { value: "gallon", label: "gallon" },
                ...options.storage_size.filter(o => !["pint", "quart", "half_gallon", "gallon"].includes(o))
              ]}
              onAddOption={addOption}
              allowEmpty
              emptyLabel="-- none --"
            />
          </div>
          <div className="edit-field">
            <label>Image URL:</label>
            <input name="image_url" type="text" value={editItem.image_url} onChange={changeEditField} placeholder="paste URL" />
          </div>
          <div className="edit-field">
            <label>Substitutes?</label>
            <select name="has_substitutes" value={editItem.has_substitutes} onChange={changeEditField}>
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>
          </div>
          {editItem.has_substitutes === "yes" && (
            <div className="edit-field">
              <label>Substitutes:</label>
              <SubstituteSelector
                value={editItem.substitutes}
                onChange={(subs) => setEditItem({ ...editItem, substitutes: subs })}
                excludeItemName={editItem.name}
              />
            </div>
          )}
          <div className="edit-field">
            <label>Brand matters?</label>
            <select name="brand_matters" value={editItem.brand_matters} onChange={changeEditField}>
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>
          </div>
          {editItem.brand_matters === "yes" && (
            <div className="edit-field">
              <label>Brand:</label>
              <input name="brand" type="text" value={editItem.brand} onChange={changeEditField} />
            </div>
          )}
          <div className="edit-field">
            <label>Breaks down?</label>
            <select name="breaks_down" value={editItem.breaks_down} onChange={changeEditField}>
              <option value="no">no</option>
              <option value="yes">yes</option>
            </select>
          </div>
          {editItem.breaks_down === "yes" && (
            <>
              <div className="edit-field">
                <label>Component 1:</label>
                <input name="breaks_into_1" type="text" value={editItem.breaks_into_1} onChange={changeEditField} />
              </div>
              <div className="edit-field">
                <label>Component 2:</label>
                <input name="breaks_into_2" type="text" value={editItem.breaks_into_2} onChange={changeEditField} />
              </div>
            </>
          )}
          <div className="edit-buttons">
            <button type="submit">save</button>
            <button type="button" onClick={() => setMode("row")}>cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // DELETE VIEW: Confirmation
  if (mode === "delete") {
    return (
      <div className="item-delete-confirm" style={{ borderColor: categoryColor }}>
        <h4>Remove {dupe.name}?</h4>
        <p>Remove from your pod's database entirely?</p>
        <div className="delete-actions">
          <button className="delete-confirm-btn" onClick={handleDeleteFromPod}>
            yes, delete from pod
          </button>
          <button className="delete-cancel-btn" onClick={handleDeleteFromView}>
            no, just hide
          </button>
          <button className="delete-back-btn" onClick={() => setMode("row")}>
            cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DupeAdd;
