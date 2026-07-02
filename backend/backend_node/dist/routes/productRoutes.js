"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// Public Route (Anyone can view products)
router.get('/', productController_1.getAllProducts);
router.get('/:id', productController_1.getProductById);
exports.default = router;
