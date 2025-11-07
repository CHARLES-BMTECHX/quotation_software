
const mongoose = require('mongoose');
// model/quotation.js


const itemSchema = new mongoose.Schema({
  productDescription: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  gstAmount: { type: Number, required: true }, // GST per item
  amount: { type: Number, required: true },    // total (taxable + gst)
});

const quotationSchema = new mongoose.Schema({
  modelName: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  validity: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  storeName: { type: String, required: true, trim: true },
  logo: { type: String },
  items: [itemSchema],
  totalAmount: { type: Number, required: true },
  gstPercent: { type: Number, default: 18 }, // Global GST %
}, { timestamps: true });

quotationSchema.index({ modelName: 'text', storeName: 'text' });

module.exports = mongoose.model('Quotation', quotationSchema);