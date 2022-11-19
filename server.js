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
let uid = "";
let email = "";
let price = "";

app.use(express.static("public"));

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

app.get("/", async (req, res) => {
  res.sendFile("public/something_went_wrong.html", { root: "." });
});

app.get("/api/:uid", async (req, res) => {
  try {
    uid = req.params.uid;
    const docRef = db.collection("eventSp").doc(uid);
    const doc = await docRef.get();
    if (doc.exists) {
      res.sendFile("public/index.html", { root: "." });
      let params = "";
      params = doc.data()["paymentParams"];
      email = params.split("/")[0];
      price = params.split("/")[1];
    } else {
      res.sendFile("public/something_went_wrong.html", { root: "." });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const order = await paypal.createOrder(email, price);

    res.json(order);
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

app.post("/api/firestore/paying/done", async (req, res) => {
  try {
    await setSubscribed();
    res.send({ message: "Payment Done!" });
  } catch (error) {
    res.send(error);
  }
});

async function setSubscribed() {
  await db.collection("eventSp").doc(uid).update({ subscriptionStatus: "yes" });
}

app.listen(8888);
