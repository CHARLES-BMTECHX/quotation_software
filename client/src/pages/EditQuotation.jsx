import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuotation, updateQuotation } from "../api/api";
import { toast } from "react-toastify";
import { X, Plus, Upload, AlertCircle } from "lucide-react";

export default function EditQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gstMode, setGstMode] = useState("global");
  const [globalGst, setGlobalGst] = useState(18);
  const [form, setForm] = useState({
    modelName: "",
    validity: "",
    phoneNumber: "",
    storeName: "",
    logo: null,
    items: [
      { productDescription: "", quantity: 1, rate: 0, gstPercent: 18, gstAmount: 0, amount: 0 },
    ],
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Use ref to track previous values for comparison
  const prevStateRef = useRef({ items: [], globalGst: 18, gstMode: "global" });

  // Auto-clear error
  const clearError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // -----------------------------------------------------------------
  // 1. Load Quotation
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchQuotation(id)
      .then((res) => {
        const data = res.data.data;

        const loadedItems = (data.items || []).map((it) => {
          const taxable = it.quantity * it.rate;
          const gstPercentFromAmount = taxable > 0 
            ? ((it.gstAmount / taxable) * 100).toFixed(2)
            : data.gstPercent || 18;

          return {
            productDescription: it.productDescription || "",
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            gstPercent: Number(gstPercentFromAmount),
            gstAmount: 0,
            amount: 0,
          };
        });

        setForm((prev) => ({ ...prev, ...data, items: loadedItems, logo: null }));
        setGlobalGst(data.gstPercent ?? 18);
        setLogoPreview(data.logo || null);

        const hasDifferentGst = loadedItems.some(
          (it, i, arr) => i > 0 && it.gstPercent !== arr[0].gstPercent
        );
        setGstMode(hasDifferentGst ? "per-item" : "global");
      })
      .catch(() => {
        toast.error("Failed to load quotation");
        navigate("/");
      });
  }, [id, navigate]);

  // -----------------------------------------------------------------
  // 2. Recalculate GST & Amount (Only when needed)
  // -----------------------------------------------------------------
  useEffect(() => {
    const current = {
      items: form.items.map(i => ({ quantity: i.quantity, rate: i.rate, gstPercent: i.gstPercent })),
      globalGst,
      gstMode,
    };

    const prev = prevStateRef.current;

    const itemsChanged = JSON.stringify(current.items) !== JSON.stringify(prev.items);
    const gstChanged = current.globalGst !== prev.globalGst || current.gstMode !== prev.gstMode;

    if (!itemsChanged && !gstChanged) return;

    const updatedItems = form.items.map((it) => {
      const qty = it.quantity || 0;
      const rate = it.rate || 0;
      const taxable = qty * rate;

      const gstPercent = gstMode === "per-item" ? (it.gstPercent || 0) : globalGst;
      const gst = (taxable * gstPercent) / 100;
      const amount = taxable + gst;

      return {
        ...it,
        gstPercent,
        gstAmount: parseFloat(gst.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
      };
    });

    setForm((prev) => ({ ...prev, items: updatedItems }));
    prevStateRef.current = current;
  }, [form.items, globalGst, gstMode]);

  // -----------------------------------------------------------------
  // 3. Handlers
  // -----------------------------------------------------------------
  const handleItemChange = (idx, e) => {
    const { name, value } = e.target;
    const numeric = ["quantity", "rate", "gstPercent"].includes(name) ? Number(value) || 0 : value;

    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [name]: numeric };
      return { ...prev, items };
    });

    clearError(`${name}_${idx}`);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productDescription: "",
          quantity: 1,
          rate: 0,
          gstPercent: gstMode === "per-item" ? 18 : globalGst,
          gstAmount: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (idx) => {
    if (form.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo must be < 2MB");
        return;
      }
      setForm((prev) => ({ ...prev, logo: file }));
      setLogoPreview(URL.createObjectURL(file));
      clearError("logo");
    }
  };

  // -----------------------------------------------------------------
  // 4. Validation
  // -----------------------------------------------------------------
  const validate = () => {
    const newErrors = {};

    if (!form.modelName.trim()) newErrors.modelName = "Customer name is required";
    if (!form.validity.trim()) newErrors.validity = "Validity is required";
    if (!form.phoneNumber.match(/^\d{10}$/)) newErrors.phoneNumber = "Valid 10-digit phone number required";
    if (!form.storeName.trim()) newErrors.storeName = "Store name is required";

    form.items.forEach((item, i) => {
      if (!item.productDescription.trim()) newErrors[`productDescription_${i}`] = "Description required";
      if (item.quantity < 1) newErrors[`quantity_${i}`] = "Quantity must be ≥ 1";
      if (item.rate < 0) newErrors[`rate_${i}`] = "Rate cannot be negative";
      if (gstMode === "per-item" && item.gstPercent < 0) newErrors[`gstPercent_${i}`] = "GST % cannot be negative";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors below");
      return;
    }

    const formData = new FormData();
    formData.append("modelName", form.modelName);
    formData.append("validity", form.validity);
    formData.append("phoneNumber", form.phoneNumber);
    formData.append("storeName", form.storeName);
    formData.append("gstPercent", String(globalGst));

    formData.append(
      "items",
      JSON.stringify(
        form.items.map((i) => ({
          productDescription: i.productDescription,
          quantity: i.quantity,
          rate: i.rate,
          gstPercent: i.gstPercent,
        }))
      )
    );

    if (form.logo) formData.append("logo", form.logo);

    try {
      await updateQuotation(id, formData);
      toast.success("Quotation updated successfully!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to update quotation");
    }
  };

  const grandTotal = form.items.reduce((s, it) => s + it.amount, 0).toFixed(2);

  // -----------------------------------------------------------------
  // 5. Render
  // -----------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10 my-6 md:my-10 border border-yellow-100">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center text-yellow-600 flex items-center justify-center gap-2">
        <AlertCircle size={28} className="hidden sm:inline" />
        Edit Quotation
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <input
              placeholder="Customer Name *"
              value={form.modelName}
              onChange={(e) => {
                setForm({ ...form, modelName: e.target.value });
                if (e.target.value.trim()) clearError("modelName");
              }}
              className={`w-full text-sm sm:text-base border ${errors.modelName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition`}
            />
            {errors.modelName && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.modelName}</p>}
          </div>

          <div>
            <input
              placeholder="Validity (e.g. 30 Days) *"
              value={form.validity}
              onChange={(e) => {
                setForm({ ...form, validity: e.target.value });
                if (e.target.value.trim()) clearError("validity");
              }}
              className={`w-full text-sm sm:text-base border ${errors.validity ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            />
            {errors.validity && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.validity}</p>}
          </div>

          <div>
            <input
              placeholder="Phone Number *"
              value={form.phoneNumber}
              onChange={(e) => {
                setForm({ ...form, phoneNumber: e.target.value });
                if (/^\d{10}$/.test(e.target.value)) clearError("phoneNumber");
              }}
              className={`w-full text-sm sm:text-base border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            />
            {errors.phoneNumber && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <input
              placeholder="Store Name *"
              value={form.storeName}
              onChange={(e) => {
                setForm({ ...form, storeName: e.target.value });
                if (e.target.value.trim()) clearError("storeName");
              }}
              className={`w-full text-sm sm:text-base border ${errors.storeName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
            />
            {errors.storeName && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.storeName}</p>}
          </div>
        </div>

        {/* GST Mode Toggle */}
        <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-300">
          <span className="font-medium text-gray-700">GST Mode:</span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gstMode"
                value="global"
                checked={gstMode === "global"}
                onChange={(e) => setGstMode(e.target.value)}
                className="w-4 h-4 text-yellow-600"
              />
              <span className="text-sm font-medium">Global GST %</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gstMode"
                value="per-item"
                checked={gstMode === "per-item"}
                onChange={(e) => setGstMode(e.target.value)}
                className="w-4 h-4 text-yellow-600"
              />
              <span className="text-sm font-medium">Per Item GST %</span>
            </label>
          </div>
        </div>

        {/* Global GST Input */}
        {gstMode === "global" && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-32">Global GST %</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={globalGst}
              onChange={(e) => setGlobalGst(Number(e.target.value) || 0)}
              className="w-full sm:w-28 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            />
          </div>
        )}

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Upload size={18} /> Store Logo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 bg-gray-50 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-yellow-600 file:text-white file:text-xs sm:file:text-sm file:cursor-pointer cursor-pointer"
          />
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo preview"
              className="mt-3 w-24 h-24 object-cover rounded-lg border-2 border-yellow-600 p-1"
            />
          )}
        </div>

        {/* Items */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full sm:min-w-0">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 px-4 sm:px-0">Quotation Items</h3>

            <div className="hidden sm:grid grid-cols-12 gap-2 font-medium text-xs sm:text-sm text-gray-700 border-b border-yellow-200 pb-2 px-4 sm:px-0">
              <div className={`col-span-${gstMode === 'per-item' ? '4' : '5'}`}>Description *</div>
              <div className="col-span-2 text-center">Qty *</div>
              <div className="col-span-2 text-center">Rate *</div>
              {gstMode === "per-item" && <div className="col-span-1 text-center">GST %</div>}
              <div className="col-span-2 text-center">GST</div>
              <div className="col-span-1 text-center">Amount</div>
            </div>

            {form.items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-start sm:items-center mb-4 border-b border-gray-100 pb-4 px-4 sm:px-0"
              >
                {/* Mobile */}
                <div className="sm:hidden space-y-2">
                  <label className="text-xs font-medium text-gray-600">Description *</label>
                  <input
                    name="productDescription"
                    placeholder="Product Description"
                    value={item.productDescription}
                    onChange={(e) => handleItemChange(i, e)}
                    className={`w-full border ${errors[`productDescription_${i}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  {errors[`productDescription_${i}`] && <p className="text-red-500 text-xs">{errors[`productDescription_${i}`]}</p>}
                </div>

                {/* Desktop Description */}
                <div className={`hidden sm:block ${gstMode === 'per-item' ? 'col-span-4' : 'col-span-5'}`}>
                  <input
                    name="productDescription"
                    placeholder="Product Description"
                    value={item.productDescription}
                    onChange={(e) => handleItemChange(i, e)}
                    className={`w-full border ${errors[`productDescription_${i}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  {errors[`productDescription_${i}`] && <p className="text-red-500 text-xs mt-1">{errors[`productDescription_${i}`]}</p>}
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <div className="sm:hidden"><label className="text-xs font-medium text-gray-600">Qty *</label></div>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(i, e)}
                    className={`w-full text-center border ${errors[`quantity_${i}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  {errors[`quantity_${i}`] && <p className="text-red-500 text-xs mt-1 sm:hidden">{errors[`quantity_${i}`]}</p>}
                </div>

                {/* Rate */}
                <div className="sm:col-span-2">
                  <div className="sm:hidden"><label className="text-xs font-medium text-gray-600">Rate *</label></div>
                  <input
                    name="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => handleItemChange(i, e)}
                    className={`w-full text-center border ${errors[`rate_${i}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  {errors[`rate_${i}`] && <p className="text-red-500 text-xs mt-1 sm:hidden">{errors[`rate_${i}`]}</p>}
                </div>

                {/* Per-item GST */}
                {gstMode === "per-item" && (
                  <div className="sm:col-span-1">
                    <div className="sm:hidden"><label className="text-xs font-medium text-gray-600">GST %</label></div>
                    <input
                      name="gstPercent"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.gstPercent}
                      onChange={(e) => handleItemChange(i, e)}
                      className={`w-full text-center border ${errors[`gstPercent_${i}`] ? 'border-red-500' : 'border-gray-300'} rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    />
                    {errors[`gstPercent_${i}`] && <p className="text-red-500 text-xs mt-1 sm:hidden">{errors[`gstPercent_${i}`]}</p>}
                  </div>
                )}

                {/* GST Amount */}
                <input
                  value={item.gstAmount.toFixed(2)}
                  disabled
                  className="hidden sm:block col-span-2 text-center border border-gray-200 rounded-lg px-2 py-2 bg-gray-50 text-xs sm:text-sm text-gray-700"
                />

                {/* Amount */}
                <input
                  value={item.amount.toFixed(2)}
                  disabled
                  className="hidden sm:block col-span-1 text-center border border-gray-200 rounded-lg px-2 py-2 bg-gray-50 font-medium text-xs sm:text-sm text-gray-800"
                />

                {/* Mobile GST & Amount */}
                <div className="sm:hidden grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <span className="text-gray-600">GST:</span> ₹{item.gstAmount.toFixed(2)}
                  </div>
                  <div className="text-center font-medium text-gray-800">
                    <span className="text-gray-600">Amt:</span> ₹{item.amount.toFixed(2)}
                  </div>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="sm:col-span-1 text-red-600 hover:text-red-800 text-2xl font-bold flex justify-center sm:justify-end cursor-pointer mt-2 sm:mt-0"
                >
                  <X size={20} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium text-sm sm:text-base cursor-pointer px-4 sm:px-0 mt-3"
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex justify-end mt-6">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl px-6 py-3 w-full sm:w-auto text-center sm:text-right shadow-sm">
            <p className="text-xl font-bold text-yellow-800">
              Grand Total: ₹{grandTotal}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-8">
          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Update Quotation
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all cursor-pointer text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}