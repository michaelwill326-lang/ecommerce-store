import React, { useState } from "react";

export default function AdminAddProduct() {
  // State management for raw input parameters
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  
  // File management states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Handle local image file selection and display an instant visual preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Guard rule: Block files greater than 5MB before they leave the browser
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // Creates a temporary browser URL for display
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please choose an image file to upload." });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    // 🌟 THE CRITICAL PAYLOAD: Switch from standard JSON to multi-part FormData
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("description", description);
    formData.append("image", selectedFile); // Matches upload.single("image") on your backend

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://techmart-backend-ecbi.onrender.com";
      
      const response = await fetch(`${baseUrl}/api/admin/products/add`, {
        method: "POST",
        body: formData, // ⚠️ DO NOT explicitly set 'Content-Type' header here. The browser must set it dynamically with the boundary string!
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: "success", text: "Product uploaded and synchronized completely!" });
        // Clear out the form inputs on success
        setName("");
        setPrice("");
        setStock("");
        setDescription("");
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to create product." });
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage({ type: "error", text: "Network communication breakdown. Check backend CORS." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: "550px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2 style={{ marginBottom: "20px" }}>Add New Inventory Item (Admin Panel)</h2>
      
      {message.text && (
        <div style={{ padding: "10px", marginBottom: "15px", borderRadius: "4px", backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da", color: message.type === "success" ? "#155724" : "#721c24" }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Item Title</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Price (Naira)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Stock Count</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Item Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}></textarea>
        </div>

        {/* Binary file drop field */}
        <div style={{ marginBottom: "20px", padding: "15px", border: "2px dashed #ccc", textAlign: "center" }}>
          <label style={{ display: "block", cursor: "pointer", fontWeight: "bold", color: "#007bff" }}>
            Click to Select Product Image Asset
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
          
          {previewUrl && (
            <div style={{ marginTop: "15px" }}>
              <p style={{ fontSize: "12px", color: "#666" }}>Preview Canvas:</p>
              <img src={previewUrl} alt="Upload Preview" style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "contain", border: "1px solid #eee", borderRadius: "4px" }} />
            </div>
          )}
        </div>

        <button type="submit" disabled={isUploading} style={{ width: "100%", padding: "12px", backgroundColor: isUploading ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: isUploading ? "not-allowed" : "pointer" }}>
          {isUploading ? "Uploading to Cloudinary Asset Engine..." : "Deploy Product Live"}
        </button>
      </form>
    </div>
  );
}