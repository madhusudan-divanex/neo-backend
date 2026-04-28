import mongoose,{Schema} from 'mongoose'

const subCatSchema=new Schema({
    name:{
        type:String,
        required:true
    }
},{timeStamp:true})

const SubTestCat=mongoose.model('SubTestCat',subCatSchema)
export default SubTestCat