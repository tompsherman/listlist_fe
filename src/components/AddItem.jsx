import React from "react";

const AddItem = ({ opened }) => {
  console.log("add item props", opened);
  return opened ? (
    <div>
      Add Item
      <input type="text" name="item" id="1" />
    </div>
  ) : (
    <div>AddItem</div>
  );
};

export default AddItem;
