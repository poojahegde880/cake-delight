
import express from "express";

import {
    getBasket,
    addToBasket,
    updateBasketItem,
    removeBasketItem,
    checkout
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/basket", getBasket);

router.post("/basket/items", addToBasket);

router.put("/basket/items/:cakeId", updateBasketItem);

router.delete("/basket/items/:cakeId", removeBasketItem);

router.post("/checkout", checkout);

export default router;
