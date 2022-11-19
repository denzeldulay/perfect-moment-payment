import "dotenv/config"; // loads variables from .env file
import express from "express";
import * as paypal from "./paypal-api.js";
import * as firebase_admin_app from "firebase-admin/app";
import * as firebase_admin_fstr from "firebase-admin/firestore";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

firebase_admin_app.initializeApp({
  credential: firebase_admin_app.cert(serviceAccount),
});

const app = express();
const db = firebase_admin_fstr.getFirestore();

app.use(express.static("public"));

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder();
    res.json(order);

    await testDbWrite();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  const { orderID } = req.params;
  try {
    const captureData = await paypal.capturePayment(orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

async function testDbWrite() {
  await db.collection("test").doc().set({ test: "this is a test" });
}

app.listen(8888);
