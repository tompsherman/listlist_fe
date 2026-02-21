import React, { useState, useEffect } from "react";
import axios from "axios";
import GetListIdHook from "../logic/GetListIdHook";
import DupeAdd from "./DupeAdd";
import CreatableSelect from "./CreatableSelect";
import useOptions from "../hooks/useOptions";
import SubstituteSelector from "./SubstituteSelector";
import { EXPIRATION_OPTIONS } from "../utils/categories";

const initialState = {
  name: "",
  purchase_unit: "unit",
  use_unit: "self",
  use_per_unit: 1,
  category: "vegetable",
  perishable: "true",
  time_to_expire: "nine_days",
  priority: 5,
  cost: "",
  storage_space: "fridge",
  storage_size: "",
  image_url: "",
  has_substitutes: "no",
  substitutes: [],
  brand_matters: "no",
  brand: "",
  breaks_down: "no",
  breaks_into_1: "",
  breaks_into_2: "",
};

const AddItem = ({ getList, flipNew, setFlipNew }) => {
  const newGroceryListId = GetListIdHook(getList);
  const { options, addOption } = useOptions();
  
  const [itemDatabase, setItemDatabase] = useState([]);
  const [newItem, setNewItem] = useState(initialState);
  const [mode, setMode] = useState("quick"); // "quick" or "full"
  const [step, setStep] = useState("form"); // "form", "quantity", "saving"
  const [desiredAmount, setDesiredAmount] = useState(1);
  const [createdItemId, setCreatedItemId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch items database for duplicate checking
  useEffect(() => {
    axios
      .get(`https://listlist-db.onrender.com/api/items/`)
      .then((response) => setItemDatabase(response.data))
      .catch((error) => console.error("Error fetching items:", error.message));
  }, []);

  // Check for duplicates as user types
  const dupeCheck = newItem.name.length >= 2
    ? itemDatabase.filter((item) =>
        item.name.toLowerCase().startsWith(newItem.name.toLowerCase())
      )
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleCancel = () => {
    setNewItem(initialState);
    setStep("form");
    setMode("quick");
    setDesiredAmount(1);
    setCreatedItemId(null);
    setFlipNew(false);
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.name.trim()) {
      alert("Please enter an item name");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `https://listlist-db.onrender.com/api/items`,
        newItem
      );
      console.log("Item created:", response.data);
      setCreatedItemId(response.data.item_id || response.data._id);
      setStep("quantity");
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Error creating item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToList = async () => {
    if (!createdItemId || !newGroceryListId?.list_id) {
      alert("Error: Missing item or list ID");
      return;
    }

    setIsSubmitting(true);

    try {
      const listItem = {
        list_id: newGroceryListId.list_id,
        item_id: createdItemId,
        desired_amount: parseInt(desiredAmount) || 1,
        acquired_amount: 0,
      };

      await axios.post(
        `https://listlist-db.onrender.com/api/list_items`,
        listItem
      );

      console.log("Added to list:", listItem);
      
      // Reset and close
      setNewItem(initialState);
      setStep("form");
      setDesiredAmount(1);
      setCreatedItemId(null);
      setFlipNew(!flipNew);
    } catch (error) {
      console.error("Error adding to list:", error);
      alert("Error adding to list. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveForLater = () => {
    // Item already saved to DB, just close
    setNewItem(initialState);
    setStep("form");
    setDesiredAmount(1);
    setCreatedItemId(null);
    setFlipNew(!flipNew);
  };

  // If user clicks on a duplicate item
  const handleSelectDupe = (dupe) => {
    // Item already exists, go straight to quantity
    setCreatedItemId(dupe.item_id || dupe._id);
    setNewItem({ ...newItem, name: dupe.name, purchase_unit: dupe.purchase_unit });
    setStep("quantity");
  };

  // Render the "Add to List?" step
  if (step === "quantity") {
    return (
      <div className="AddItem add-item-quantity">
        <h4>Add to {getList} list?</h4>
        <p className="item-created-name">{newItem.name}</p>
        
        <div className="quantity-input">
          <label>How many {newItem.purchase_unit}?</label>
          <input
            type="number"
            min="1"
            value={desiredAmount}
            onChange={(e) => setDesiredAmount(e.target.value)}
            autoFocus
          />
        </div>

        <div className="quantity-actions">
          <button 
            className="add-to-list-btn"
            onClick={handleAddToList}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : `Add ${desiredAmount} to list`}
          </button>
          <button 
            className="save-later-btn"
            onClick={handleSaveForLater}
          >
            Save for later
          </button>
        </div>
      </div>
    );
  }

  // Render the main form
  return (
    <div className="AddItem add-item-form">
      <div className="add-item-header">
        <h4>Add New Item</h4>
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === "quick" ? "active" : ""}`}
            onClick={() => setMode("quick")}
            type="button"
          >
            Quick Add
          </button>
          <button 
            className={`mode-btn ${mode === "full" ? "active" : ""}`}
            onClick={() => setMode("full")}
            type="button"
          >
            Full Details
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitItem}>
        {/* NAME - always shown */}
        <div className="form-field">
          <label>Name *</label>
          <input
            name="name"
            type="text"
            value={newItem.name}
            onChange={handleChange}
            placeholder="e.g., eggs, milk, bread"
            autoFocus
          />
        </div>

        {/* Show duplicates if found */}
        {dupeCheck.length > 0 && (
          <div className="dupe-suggestions">
            <p className="dupe-label">Already exists:</p>
            {dupeCheck.slice(0, 5).map((dupe) => (
              <DupeAdd
                key={dupe.item_id || dupe._id}
                item_id={dupe.item_id || dupe._id}
                list_id={newGroceryListId?.list_id}
                dupe={dupe}
                flipNew={flipNew}
                setFlipNew={setFlipNew}
                setFormToggle={() => {}}
                initialFormToggle={{}}
                setNewItem={setNewItem}
                initialState={initialState}
                onSelect={() => handleSelectDupe(dupe)}
              />
            ))}
            <p className="dupe-or">— or create new —</p>
          </div>
        )}

        {/* QUICK ADD FIELDS */}
        <div className="form-row">
          <div className="form-field half">
            <label>Category</label>
            <CreatableSelect
              name="category"
              value={newItem.category}
              onChange={handleChange}
              options={options.category}
              onAddOption={addOption}
            />
          </div>
          <div className="form-field half">
            <label>Purchase Unit</label>
            <CreatableSelect
              name="purchase_unit"
              value={newItem.purchase_unit}
              onChange={handleChange}
              options={options.purchase_unit}
              onAddOption={addOption}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field half">
            <label>Cost ($)</label>
            <input
              name="cost"
              type="number"
              step="0.01"
              value={newItem.cost}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div className="form-field half">
            <label>Storage</label>
            <CreatableSelect
              name="storage_space"
              value={newItem.storage_space}
              onChange={handleChange}
              options={options.storage_space}
              onAddOption={addOption}
            />
          </div>
        </div>

        {/* FULL DETAILS - only in full mode */}
        {mode === "full" && (
          <>
            <hr className="form-divider" />
            
            <div className="form-row">
              <div className="form-field half">
                <label>Use Unit</label>
                <CreatableSelect
                  name="use_unit"
                  value={newItem.use_unit}
                  onChange={handleChange}
                  options={[
                    { value: "self", label: "whole item" },
                    ...options.use_unit.filter(o => o !== "self"),
                  ]}
                  onAddOption={addOption}
                />
              </div>
              <div className="form-field half">
                <label>Uses per {newItem.purchase_unit}</label>
                <input
                  name="use_per_unit"
                  type="number"
                  min="1"
                  value={newItem.use_per_unit}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field half">
                <label>Perishable?</label>
                <select name="perishable" value={newItem.perishable} onChange={handleChange}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="form-field half">
                <label>Expires after</label>
                <select name="time_to_expire" value={newItem.time_to_expire} onChange={handleChange}>
                  {EXPIRATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field half">
                <label>Storage Size</label>
                <CreatableSelect
                  name="storage_size"
                  value={newItem.storage_size}
                  onChange={handleChange}
                  options={[
                    { value: "", label: "— none —" },
                    { value: "pint", label: "pint" },
                    { value: "quart", label: "quart" },
                    { value: "half_gallon", label: "half gallon" },
                    { value: "gallon", label: "gallon" },
                  ]}
                  onAddOption={addOption}
                  allowEmpty
                />
              </div>
              <div className="form-field half">
                <label>Brand matters?</label>
                <select name="brand_matters" value={newItem.brand_matters} onChange={handleChange}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            {newItem.brand_matters === "yes" && (
              <div className="form-field">
                <label>Preferred Brand</label>
                <input
                  name="brand"
                  type="text"
                  value={newItem.brand}
                  onChange={handleChange}
                  placeholder="e.g., Organic Valley"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-field half">
                <label>Has substitutes?</label>
                <select name="has_substitutes" value={newItem.has_substitutes} onChange={handleChange}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="form-field half">
                <label>Breaks down?</label>
                <select name="breaks_down" value={newItem.breaks_down} onChange={handleChange}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            {newItem.has_substitutes === "yes" && (
              <div className="form-field">
                <label>Substitutes</label>
                <SubstituteSelector
                  value={newItem.substitutes}
                  onChange={(subs) => setNewItem({ ...newItem, substitutes: subs })}
                  excludeItemName={newItem.name}
                />
              </div>
            )}

            {newItem.breaks_down === "yes" && (
              <div className="form-row">
                <div className="form-field half">
                  <label>Breaks into #1</label>
                  <input
                    name="breaks_into_1"
                    type="text"
                    value={newItem.breaks_into_1}
                    onChange={handleChange}
                    placeholder="e.g., chicken meat"
                  />
                </div>
                <div className="form-field half">
                  <label>Breaks into #2</label>
                  <input
                    name="breaks_into_2"
                    type="text"
                    value={newItem.breaks_into_2}
                    onChange={handleChange}
                    placeholder="e.g., chicken broth"
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label>Image URL (optional)</label>
              <input
                name="image_url"
                type="text"
                value={newItem.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </>
        )}

        {/* Cost per use hint */}
        {newItem.cost && newItem.use_per_unit > 0 && (
          <div className="cost-hint">
            Cost per {newItem.use_unit === "self" ? newItem.name || "use" : newItem.use_unit}: 
            ${(parseFloat(newItem.cost) / parseInt(newItem.use_per_unit)).toFixed(2)}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || !newItem.name.trim()}
          >
            {isSubmitting ? "Saving..." : mode === "quick" ? "Quick Add" : "Create Item"}
          </button>
          <button 
            type="button" 
            className="cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
