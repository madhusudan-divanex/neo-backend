import mongoose, { Schema } from "mongoose";

const firstPharSchema=new Schema({
    image:String,
    star:String,
    name:String,
    description:String
},{timestamps:true})
const CMSTestimonial=mongoose.model('testimonial-patient-page',firstPharSchema)
export default CMSTestimonial;