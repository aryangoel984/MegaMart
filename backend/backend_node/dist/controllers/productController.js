"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const getAllProducts = async (req, res) => {
    try {
        const products = await db_1.default.product.findMany();
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching products' });
    }
};
exports.getAllProducts = getAllProducts;
