var mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/resourcedb", { useNewUrlParser: true })
var resourceSchema = new mongoose.Schema({
	Rid : String,
	imp : Number,
	quantity: Number,
		name         : String,
	category     : String
})

var campResourceSchema = new mongoose.Schema({
	Cid : String,
	requested : [resourceSchema],
	allocated : [resourceSchema]
})
var CampResource = mongoose.model("CampResource",campResourceSchema)

CampResource.create({
	Cid : "CID00001",
	requested : [],
	allocated : []
})

// CampResource.findOne({Cid:"C030"},function(err,obj){
// 	if(err){
// 		console.log(err)
// 	}else{
// 		obj.requested.push({
// 			Rid : "R331",
// 			imp : 2,
// 			quantity : 22

// 		})
// 		console.log(obj)
// 		obj.save()
// 	}
// })
