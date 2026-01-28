import Speciality from "../../models/Speciality.js"
import safeUnlink from "../../utils/globalFunction.js"

export const addSpecialty = async (req, res) => {
    const icon = req?.file?.path
    const { name } = req.body
    try {
        const isExist = await Speciality.findOne({ name })
        if (isExist) {
            safeUnlink(icon)
            return res.status(200).json({ message: "Name already exists", success: false })
        }
        const data = await Speciality.create({ name, icon })
        if (data) {
            return res.status(200).json({ message: "Speciality created", success: true })
        }
        return res.status(200).json({ message: "Speciality not created", success: false })
    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const getSpecialty = async (req, res) => {
    try {
        const isExist = await Speciality.find()
        return res.status(200).json({ message: "Speciality fetched",data:isExist, success: true })

    } catch (error) {
        return res.status(200).json({ message: "Server Error", success: false })
    }
}
export const updateSpecialty=async(req,res)=>{
    const icon=req?.file?.path
    const {name,spId}=req.body
    try {
        const isExist=await Speciality.findOne({name,_id:{$ne:spId}})
        if(isExist){
            safeUnlink(icon)
            return res.status(200).json({message:"Name already exists",success:false})
        }
        if(isExist?.icon && icon){
            safeUnlink(isExist?.icon)
        }
        const data=await Speciality.findByIdAndUpdate(spId,{name,icon},{new:true})
        if(data){
            return res.status(200).json({message:"Speciality updated",success:true})
        }
        return res.status(200).json({message:"Speciality not updated",success:false})
    } catch (error) {
        console.log(error)
        return res.status(200).json({message:"Server Error",success:false})
    }
}
export const deleteSpecialty=async(req,res)=>{
    const {id}=req.params
    try {
        const isExist=await Speciality.findById(id)
        if(!isExist){
            return res.status(200).json({message:"Specialty not exists",success:false})
        }
        const data=await Speciality.findByIdAndDelete(id)
        if(data){
            safeUnlink(isExist.icon)
            return res.status(200).json({message:"Speciality deleted",success:true})
        }
        return res.status(200).json({message:"Speciality not deleted",success:false})
    } catch (error) {
        return res.status(200).json({message:"Server Error",success:false})
    }
}