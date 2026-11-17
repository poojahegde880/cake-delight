
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();

app.use(cors());

app.get("/health", (req, res) => {
    res.json({ message: "API Gateway is running" });
});

// Catalog Service
app.use(
    createProxyMiddleware({
        target: process.env.CATALOG_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/catalog/**"
    })
);

// Order Service
app.use(
    createProxyMiddleware({
        target: process.env.ORDER_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/orders/**"
    })
);

// Rating Service
app.use(
    createProxyMiddleware({
        target: process.env.RATING_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/ratings/**"
    })
);

// Notification Service
app.use(
    createProxyMiddleware({
        target: process.env.NOTIFICATION_SERVICE_URL,
        changeOrigin: true,
        pathFilter: "/notifications/**"
    })
);

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API Gateway running on port ${PORT}`);
});
