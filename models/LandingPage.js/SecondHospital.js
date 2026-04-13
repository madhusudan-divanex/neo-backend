import mongoose, { Schema } from "mongoose";

const secondHospitalSchema=new Schema({
    title:String,
    description:String, 
    feature:[{category:String,title:String,subTitle:String,desc:String,firstLink:String,secondLink:String,image:String}],
    otDashboard:[{title:String,status:String,progress:Number,image:String}],
    patientTimeline:String,
    neoAiAssist:String
},{timestamps:true})
const SecondHospital=mongoose.model('second-hospital-page',secondHospitalSchema)
export default SecondHospital;