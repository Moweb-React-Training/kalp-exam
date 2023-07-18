import React, { useState, useEffect } from "react";
import axios from "axios";
import { AsyncPaginate } from "react-select-async-paginate";
import DropdownDatePicker from "./DropdownDatePicker";

function App({ onLogout }) {
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState({
    value: "",
    label: "select",
  });
  const [token, setToken] = useState(null);
  const [textBoxValue, setTextBoxValue] = useState("");
  const [inwardQty, setInwardQty] = useState("");
  const [additionalBoxes, setAdditionalBoxes] = useState([]);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState(null);
  const [submittedData, setSubmittedData] = useState([]);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await axios.post(
          "https://eaf-dms-api.yecor.com/api/auth/login",
          {
            email: "yagnikoo@yopmail.com",
            password: "Moweb@123 ",
            device_id: "sDUhIoUzN41Is4iM1r0BcsDP4exWLpInVxuT50Ft",
            device_token:
              "cyKtfAZpI9GBrLUfz8SgWV:APA91bEECZrhEE80WnlJmEOiX6_EJ-JtDF9IV5eW96wgj-ghSJ7c3K5ZG9Psh8CMyYWcoDxDcfU805SDRpBdoJompANG3YTp0aeR4wlT5tiWZdmK-3KPq7kECF8raRLRfh0qW3TN1SnA",
            device_type: "web",
          }
        );

        const { token } = response.data;
        setToken(token);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchToken();
  }, []);

  // product SKU API
  const loadWarehouseOptions = async (
    inputValue,
    loadedOptions,
    offsetValue
  ) => {
    try {
      let options = [];
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        "https://eaf-dms-api.yecor.com/api/inventory/product-SKUs/?warehouse_id=22&ordering=name&search=&limit=10&offset=&remove_product_stocking=true",
        { headers }
      );

      let hasMore = false;
      if (response.data.results) {
        if (response.data.next !== null) {
          const queryParams = new URLSearchParams(response.data.next);
          let newOffset = queryParams.get("offset");
          offsetValue = newOffset;
          hasMore = true;
        }
        if (
          loadedOptions &&
          loadedOptions.additional &&
          loadedOptions.additional.page
        ) {
          loadedOptions.additional.page = loadedOptions.additional.page + 1;
        }
      }

      const jsonData = response.data;
      options = [
        ...loadedOptions,
        ...jsonData.results.map((item) => ({
          value: item.id,
          label: item.name,
        })),
      ];

      return {
        options,
        hasMore: response.data.next !== null,
        additional: {
          page: loadedOptions ? (loadedOptions.page || 0) + 1 : 1,
        },
      };
    } catch (error) {
      console.log("Error:", error);
      return {
        options: [],
        hasMore: false,
      };
    }
  };

  const handleWarehouseDropdownChange = async (selectedOption) => {
    setSelectedWarehouse(selectedOption);
    setOffset(0);
    setData(null);
  };

  const handleTextBoxChange = (event) => {
    const value = event.target.value;
    setTextBoxValue(value);
  };

  const handleInwardQtyChange = (event) => {
    const value = event.target.value;
    setInwardQty(value);
  };

  const handleAddBox = () => {
    setAdditionalBoxes((prevBoxes) => [
      ...prevBoxes,
      { textBoxValue: "", inwardQty: "" },
    ]);
  };

  const handleRemoveBox = (index) => {
    setAdditionalBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes];
      updatedBoxes.splice(index, 1);
      return updatedBoxes;
    });
  };

  const handleAdditionalBoxChange = (index, field, value) => {
    setAdditionalBoxes((prevBoxes) => {
      const updatedBoxes = [...prevBoxes];
      updatedBoxes[index][field] = value;
      return updatedBoxes;
    });
  };

  // submit APi
  const handleSubmit = async () => {
    if (!textBoxValue || !inwardQty) {
      alert("Please enter values for Batch Number and Inward Quantity.");
      return;
    }
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const FreshProduct = "Fresh";
      const In = "In";

      const payload = {
        product_id: selectedWarehouse.value,
        batch_number: textBoxValue,
        expiry_date: selectedExpiryDate,
        qty: inwardQty,
        stock_type: FreshProduct,
        stock_entry_type: In,
        receiver_warehouse_id: 62,
      };

      const response = await axios.post(
        "https://eaf-dms-api.yecor.com/api/inventory/bulk_stock_in_out/",
        payload,
        { headers }
      );

      const submittedItem = {
        product_id: selectedWarehouse.value,
        batch_number: textBoxValue,
        expiry_date: selectedExpiryDate,
        qty: inwardQty,
      };

      setSubmittedData((prevData) => [...prevData, submittedItem]);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", marginBottom: "10px" }}>
        <div style={{ marginRight: "20px" }}>
          <h2>Product SKU *</h2>

          <div style={{ width: "200px" }}>
            <AsyncPaginate
              value={selectedWarehouse}
              onChange={handleWarehouseDropdownChange}
              loadOptions={loadWarehouseOptions}
              className="dropdown-select"
            />
          </div>
        </div>
        <div>
          <h2>Batch Number*</h2>
          <input
            type="text"
            style={{ height: "33px" }}
            value={Number(textBoxValue) ? `#${textBoxValue}` : textBoxValue}
            onChange={handleTextBoxChange}
            placeholder="Type here.."
          />
        </div>
        <div style={{ marginLeft: "20px" }}>
          <h2>Expiry date*</h2>
          <DropdownDatePicker />
        </div>
        <div style={{ marginLeft: "20px" }}>
          <h2>Inward qty*</h2>
          <input
            type="number"
            style={{ height: "33px" }}
            value={inwardQty}
            onChange={handleInwardQtyChange}
            placeholder="Type here..."
          />
        </div>
      </div>
      {additionalBoxes.map((box, index) => (
        <div key={index} style={{ display: "flex", marginBottom: "10px" }}>
          <div style={{ marginRight: "20px" }}>
            <div style={{ width: "200px" }}>
              <AsyncPaginate
                value={box.selectedWarehouse}
                onChange={(selectedOption) =>
                  handleAdditionalBoxChange(
                    index,
                    "selectedWarehouse",
                    selectedOption
                  )
                }
                loadOptions={loadWarehouseOptions}
                className="dropdown-select"
              />
            </div>
          </div>
          <div>
            <input
              type="text"
              style={{ height: "33px" }}
              value={box.textBoxValue}
              onChange={(event) =>
                handleAdditionalBoxChange(
                  index,
                  "textBoxValue",
                  event.target.value
                )
              }
              placeholder="Type here.."
            />
            {Number(box.textBoxValue) ? (
              <span>{`#${box.textBoxValue}`}</span>
            ) : (
              <span>{box.textBoxValue}</span>
            )}
          </div>
          <div style={{ marginLeft: "20px" }}>
            <DropdownDatePicker />
          </div>
          <div style={{ marginLeft: "20px" }}>
            <input
              type="number"
              style={{ height: "33px" }}
              value={box.inwardQty}
              onChange={(event) =>
                handleAdditionalBoxChange(
                  index,
                  "inwardQty",
                  event.target.value
                )
              }
              placeholder="Type here..."
            />
          </div>
          <div style={{ marginLeft: "20px" }}>
            <button onClick={() => handleRemoveBox(index)}>x</button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleAddBox}>+</button>
        <button style={{ marginLeft: "330px" }}>cancel</button>
        <button style={{ marginLeft: "20px" }} onClick={handleSubmit}>
          Submit
        </button>
      </div>

      {submittedData.length > 0 && (
        <div>
          <h2>Submitted Data</h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Product ID
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Batch Number
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Expiry Date
                </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>
                  Inward Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {submittedData.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {item.product_id}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {item.batch_number}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {item.expiry_date}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {item.qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
