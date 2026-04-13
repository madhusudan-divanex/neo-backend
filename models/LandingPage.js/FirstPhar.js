import mongoose, { Schema } from "mongoose";

const firstPharSchema=new Schema({
    firstTitle:String,
    secondTitle:String,
    description:String,
    btnLink:{btnFirst:String,btnSecond:String},
    opsSnapshot:{
        prescriptions:Number,
        dispensed:Number,
        billDelivery:Number,
        invoiceDelivery:String
    },
    model:[{
    image:String,
    name:String,
    description:String
    }]
},{timestamps:true})
const FirstPhar=mongoose.model('first-phar-page',firstPharSchema)
export default FirstPhar;