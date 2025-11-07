const Quotation = require('../model/quotation');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { getPagination } = require('../utils/pagination');

// CREATE
exports.createQuotation = async (req, res) => {
  try {
    const { modelName, validity, phoneNumber, storeName, gstPercent = 18 } = req.body;
    let items = req.body.items;

    // Parse items if sent as JSON string
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({ success: false, error: "Invalid items format" });
      }
    }

    // Handle logo upload
    let logoUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'quotations/logos',
        transformation: { width: 200, height: 200, crop: 'limit' }
      });
      logoUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    // Process items with per-item or global GST
    const itemsWithAmount = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const itemGstPercent = item.gstPercent !== undefined ? Number(item.gstPercent) : Number(gstPercent);
      const taxable = quantity * rate;
      const gstAmount = (taxable * itemGstPercent) / 100;
      const amount = taxable + gstAmount;

      return {
        productDescription: item.productDescription,
        quantity,
        rate,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
      };
    });

    const totalAmount = itemsWithAmount.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

    const quotation = await Quotation.create({
      modelName,
      validity,
      phoneNumber,
      storeName,
      logo: logoUrl,
      items: itemsWithAmount,
      totalAmount: Number(totalAmount),
      gstPercent: Number(gstPercent), // Global GST stored
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ALL + PAGINATION + SEARCH + FILTER + SORT
exports.getQuotations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const { skip, limit: pageSize } = getPagination(parseInt(page), parseInt(limit));

    let query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { modelName: regex },
        { storeName: regex },
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate)   query.date.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const quotations = await Quotation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .select('-__v');

    const total = await Quotation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: quotations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET SINGLE
exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE
exports.updateQuotation = async (req, res) => {
  try {
    let { items, gstPercent = 18, ...fields } = req.body;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid items format" });
      }
    }

    gstPercent = Number(gstPercent);

    let logoUrl = fields.logo;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "quotations/logos",
        transformation: { width: 200, height: 200, crop: "limit" },
      });
      logoUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const itemsWithAmount = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const itemGstPercent = item.gstPercent !== undefined ? Number(item.gstPercent) : gstPercent;
      const taxable = quantity * rate;
      const gstAmount = (taxable * itemGstPercent) / 100;
      const amount = taxable + gstAmount;

      return {
        productDescription: item.productDescription,
        quantity,
        rate,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        amount: parseFloat(amount.toFixed(2)),
      };
    });

    const totalAmount = itemsWithAmount.reduce((sum, item) => sum + item.amount, 0).toFixed(2);

    const updatedData = {
      ...fields,
      logo: logoUrl,
      items: itemsWithAmount,
      totalAmount: Number(totalAmount),
      gstPercent,
    };

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }

    if (quotation.logo) {
      const publicId = quotation.logo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`quotations/logos/${publicId}`);
    }

    await Quotation.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Quotation deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};