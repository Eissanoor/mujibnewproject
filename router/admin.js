const express = require("express");
const router = new express.Router();
const { ObjectId } = require("mongodb");
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const validator = require("validator");
const cron = require("node-cron");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const multer = require("multer");
const auth = require("../middleware/auth");
const providerRegister = require("../model/providerregister");
const emailvarify = require("../model/emailotp");
const mirsal = require("../model/mirsal")
const { profile } = require("console");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const qr = require('qr-image');
var dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
require("../database/db");
router.use(cors());
router.use(cookieparser());
router.use(bodyparser.urlencoded({ extended: true }));
router.use(express.urlencoded({ extended: false }));
router.use(bodyparser.json());
router.use(express.json());
const mailgun = require("mailgun-js");
const mailGun = process.env.mailGun;
const DOMAIN = mailGun;
const Email_otp_pass = process.env.Email_otp_pass;
const C_cloud_name = process.env.C_cloud_name;
const C_api_key = process.env.C_api_key;
const C_api_secret = process.env.C_api_secret;
const MailGun_api_key = process.env.MailGun_api_key;
cloudinary.config({
  cloud_name: C_cloud_name,
  api_key: C_api_key,
  api_secret: C_api_secret,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.use("/ProfileImage", express.static("public/upload"));
router.use("/image", express.static("public/upload"));
router.use("/categoryThumbnail", express.static("public/upload"));
router.get("/", async (req, res) =>
{
  try {

    res.status(200).json({
      status: 200,
      message: "Success",
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null,
    });
  }
});
router.post("/signUp", async (req, res) =>
{
  let qdate = new Date();
  let date = qdate.toDateString();
  let Id = Math.floor(Math.random() * 10000000) + 1;
  let email = req.body.email;
  const mail = await providerRegister.findOne({ email: email });
  if (mail) {
    res
      .status(404)
      .json({ status: 404, message: "email already present", data: null });
  }
  try {
    const registerEmp = new providerRegister({
      Id: Id,
      password: req.body.password,
      email: req.body.email,
      date: date,
      ProfileImage: null,
      address: null,
      Phone: null,
      isVarified: false,
      isNewUser: true,
    });
    const registered = await registerEmp.save();
    const data = await providerRegister
      .findOne({ email: email })
      .select({ _id: 1, email: 1 });
    res.status(201).json({
      status: 201,
      message: "User has been Created",
      data: data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ status: 400, message: "not found", data: null });
  }
});
router.post("/changePassword", async (req, res) =>
{
  try {
    const email = req.body.email;
    const mailVarify = await providerRegister.findOne({ email: email });
    if (mailVarify) {
      const password = req.body.password;
      const ismatch = await bcrypt.compare(password, mailVarify.password);
      console.log(ismatch);
      mailVarify.password = password;
      const registered = await mailVarify.save();
      res.status(201).json({
        status: 201,
        message: "password change successful",
        data: mailVarify,
      });


    } else {

      res.status(400).json({ status: 400, message: "email not exist", data: null });
    }


  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
  }
});
router.post("/emailVrifyOtp", async (req, res) =>
{
  try {
    const email = req.body.email;
    const code = req.body.code;
    const mail = await emailvarify.findOne({ code: code, email: email });
    if (mail) {
      const currentTime = new Date().getTime();
      const Diff = mail.expireIn - currentTime;
      if (Diff < 0) {
        res.status(401).json({
          status: 401,
          message: "otp expire with in 5 mints",
          data: null,
        });
      } else {
        const getmens = await providerRegister.findOneAndUpdate(
          { email: email },
          { $set: { isVarified: true } },
          { new: true }
        );

        res.status(200).json({
          status: 200,
          message: "email varification successful",
          data: null,
        });
      }
    } else {
      res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "Invalid Otp", data: null });
  }
});
router.post("/Login", async (req, res) =>
{
  try {
    const email = req.body.email;
    const password = req.body.password;
    const oneMonthInMillis = 30 * 24 * 60 * 60 * 1000;
    const expirationTime = new Date().getTime() + oneMonthInMillis;
    const useremail = await providerRegister.findOne({ email: email });
    const ismatch = await bcrypt.compare(password, useremail.password);

    if (!useremail || !password) {
      res.status(400).json({
        status: 400,
        message: "Enter Correct email or password",
        data: null,
      });
    } else if (ismatch) {
      const getmens = await providerRegister.findOneAndUpdate(
        { email: email },
        { $set: { expireIn: expirationTime } },
        { new: true }
      );
      const token = await useremail.generateAuthToken();
      res.cookie("jwt", token, { httpOnly: true });
      res.status(200).json({
        status: 200,
        message: "Login Successfully",
        data: {
          _id: useremail._id,
          isVerified: useremail.isVarified,
          isNewUser: useremail.isNewUser,
          accessToken: token,
        },
      });
    } else {
      res
        .status(404)
        .json({ status: 400, message: "Invalid Password", data: null });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ status: 400, message: "invalid email", data: null });
  }
});
function generateQRCode(cardno, size = 10)
{
  // Generate QR code with the card number as the content
  const qr_png = qr.imageSync(cardno, { type: 'png', ec_level: 'H', parse_url: true, margin: 1, size: size });
  // Return the QR code as a base64 encoded string
  return qr_png.toString('base64');
}
router.post("/add-mirsal", async (req, res) =>
{
  try {
    const { cardno, Date, load, vehicltype, enginehp, modelyear,
      weight, origin, importer_or_owner, chassisno,
      declearationno, color, enginno, comments, Vehicledrive, EngineCapacity,
      PassengerCapacity, CarriageCapacity, VehicleBrandName, SpecificationStandardName,
      VCCGenerationDate, DeclarationDate, Vehiclemodel, OwnerCode } = req.body;

    // Check if any required field is an empty string
    if (!cardno || !importer_or_owner || !color || !vehicltype) {
      // Respond with a 400 status code and a message indicating missing parameters
      return res.status(400).json({
        status: 400,
        message: "Required parameter is missing or empty",
        data: null,
      });
    }

    const itemNameexist = await mirsal.findOne({ cardno: cardno });
    if (!itemNameexist) {
      const qrCode1 = generateQRCode(cardno, 20);
      const MenuEmp = new mirsal({
        cardno: cardno,
        Date: Date,
        load: load,
        vehicltype: vehicltype,
        enginehp: enginehp,
        modelyear: modelyear,
        weight: weight,
        origin: origin,
        importer_or_owner: importer_or_owner,
        chassisno: chassisno,
        declearationno: declearationno,
        color: color,
        enginno: enginno,
        comments: comments,
        Vehicledrive: Vehicledrive,
        EngineCapacity: EngineCapacity,
        PassengerCapacity: PassengerCapacity,
        CarriageCapacity: CarriageCapacity,
        VehicleBrandName: VehicleBrandName,
        SpecificationStandardName: SpecificationStandardName,
        VCCGenerationDate: VCCGenerationDate,
        DeclarationDate: DeclarationDate,
        OwnerCode: OwnerCode,
        Vehiclemodel: Vehiclemodel,
        qrcode: qrCode1
      });
      const menu = await MenuEmp.save();
      res.status(201).json({
        status: 201,
        message: "card has been Added",
        data: MenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "card already present",
        data: null,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 400,
      message: "Required parameter is missing",
      data: null,
    });
  }
});

// PUT request to update an existing mirsal entry
router.put("/update-mirsal/:cardno", async (req, res) =>
{
  try {
    const { cardno } = req.params;
    const {
      Date,
      load,
      vehicltype,
      enginehp,
      modelyear,
      weight,
      origin,
      importer_or_owner,
      chassisno,
      declearationno,
      color,
      enginno,
      comments, Vehicledrive, EngineCapacity,
      PassengerCapacity, CarriageCapacity, VehicleBrandName, SpecificationStandardName,
      VCCGenerationDate, DeclarationDate, OwnerCode, Vehiclemodel
    } = req.body;

    const updatedMenuEmp = await mirsal.findOneAndUpdate(
      { cardno: cardno },
      {
        $set: {
          Date: Date,
          load: load,
          vehicltype: vehicltype,
          enginehp: enginehp,
          modelyear: modelyear,
          weight: weight,
          origin: origin,
          importer_or_owner: importer_or_owner,
          chassisno: chassisno,
          declearationno: declearationno,
          color: color,
          enginno: enginno,
          comments: comments,
          Vehicledrive: Vehicledrive,
          EngineCapacity: EngineCapacity,
          PassengerCapacity: PassengerCapacity,
          CarriageCapacity: CarriageCapacity,
          VehicleBrandName: VehicleBrandName,
          SpecificationStandardName: SpecificationStandardName,
          VCCGenerationDate: VCCGenerationDate,
          DeclarationDate: DeclarationDate,
          OwnerCode: OwnerCode,
          Vehiclemodel: Vehiclemodel

        },
      },
      { new: true }
    );

    if (updatedMenuEmp) {
      res.status(200).json({
        status: 200,
        message: "Card updated successfully",
        data: updatedMenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Card not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: "Error updating card",
      data: null,
    });
  }
});

// GET request to fetch all mirsal entries
router.get("/get-mirsal", async (req, res) =>
{
  try {
    const mirsalEntries = await mirsal.find();
    res.status(200).json({
      status: 200,
      message: "Success",
      data: mirsalEntries,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null,
    });
  }
});
router.get("/get-mirsal/:identifier", async (req, res) =>
{
  try {
    const { identifier } = req.params;
    
    // Check if identifier is a valid MongoDB ObjectId (24 character hex string)
    const isObjectId = ObjectId.isValid(identifier) && identifier.length === 24;
    
    let mirsalEntry;
    if (isObjectId) {
      // Search by _id
      mirsalEntry = await mirsal.findById(identifier);
    } else {
      // Search by cardno
      mirsalEntry = await mirsal.findOne({ cardno: identifier });
    }
    
    if (mirsalEntry) {
      res.status(200).json({
        status: 200,
        message: "Success",
        data: mirsalEntry,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Card not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null,
    });
  }
});

// DELETE request to delete a mirsal entry by card number
router.delete("/delete-mirsal/:cardno", async (req, res) =>
{
  try {
    const { cardno } = req.params;
    const deletedMenuEmp = await mirsal.findOneAndDelete({ cardno: cardno });
    if (deletedMenuEmp) {
      res.status(200).json({
        status: 200,
        message: "Card deleted successfully",
        data: deletedMenuEmp,
      });
    } else {
      res.status(404).json({
        status: 404,
        message: "Card not found",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
      data: null,
    });
  }
});





module.exports = router;
