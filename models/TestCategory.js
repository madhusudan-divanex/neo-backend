import mongoose, { Schema } from "mongoose";

const spSchema=new Schema({
    name:{
        type:String,
        unique:true,
        required:true
    },
    subCat: [{type: mongoose.Schema.Types.ObjectId, ref: 'SubTestCat'  }],
    icon:{
        type:String,
    },
})
const TestCategory=mongoose.model('test-category',spSchema)

export default TestCategory