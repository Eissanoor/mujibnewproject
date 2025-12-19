const mongoose = require("mongoose");
const mirsalschema = new mongoose.Schema(
    {
        cardno: Number,
        Date: String,
        load: String,
        vehicltype: String,
        enginehp: String,
        modelyear: String,
        weight: String,
        origin: String,
        importer_or_owner: String,
        chassisno: String,
        declearationno: String,
        color: String,
        enginno: String,
        comments: String,
        Vehicledrive: String,
        EngineCapacity: String,
        PassengerCapacity: String,
        CarriageCapacity: String,
        VehicleBrandName: String,
        SpecificationStandardName: String,
        VCCGenerationDate: String,
        DeclarationDate: String,
        OwnerCode: String,
        Vehiclemodel: String,
        qrcode: String
    },
    {
        timestamps: true,
    }
);
const mirsal = new mongoose.model("mirsal", mirsalschema);
module.exports = mirsal;
