var express               = require('express')
var app                   = express()
var mysql 				  = require('mysql')
var bodyParser            = require("body-parser");
var request               = require("request");

app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'DisasterDB'
});

connection.connect(function(error){
	if(error){
		console.log(error);
	}else{
		console.log('Connected');
	}
})

var mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/resourcedb", { useNewUrlParser: true })
var resourceSchema = new mongoose.Schema({
	Rid          : String,
	imp          : Number,
	quantity     : Number,
	name         : String,
	category     : String
})

var campResourceSchema = new mongoose.Schema({
	Cid         : String,
	requested   : [resourceSchema],
	allocated   : [resourceSchema]
})
var CampResource = mongoose.model("CampResource",campResourceSchema)

console.log("Voila!!")


app.get("/",function(req,res){
	
	connection.query("SELECT * FROM camp",function(error,rows,fields){
		if(error){
			console.log("Error");
		}else{
			console.log("query worked!!")
			console.log(rows);
			res.render("home.ejs");
		}
	})
});
app.get("/query",function(req,res){
	res.render("query.ejs")
})
app.get("/query/notfound",function(req,res){
	res.render("notfound.ejs")
})
app.get("/camp/new",function(req,res){
	res.render("campRegistration.ejs");
});


app.post("/camp/new",function(req,res){
	
				var cid = ""
				connection.query("SELECT * FROM camp;",function(error,camps,fields){
					if(error){
						console.log("Error");
					}else{
						console.log("query worked!! assigning cid...")

						cid = "CID"+String(camps.length+1000000)
						console.log(cid)
						
						var query1 = "INSERT INTO camp VALUES (\""+
									cid+"\""+","+
									"\""+req.body.admin_id+"\""+" ,"+
									"\""+req.body.location +"\""+" ,"+
									"\""+req.body.longitude +"\""+" ,"+
									"\""+req.body.latitude +"\""+" ,"+
									"\""+req.body.threat_level +"\""+" ,"+
									"\""+req.body.active_from +"\""+" ,"+
									0 +" ,"+
									req.body.password + ");";

						connection.query(query1,function(error,camp){
							if(error){
								console.log(query)
								console.log("Error\n" +error);
							}else{
								console.log("adding new camp...")
								console.log(query)
								res.redirect("/camp/"+req.params.id)
							}
						})
					}
				})
})
app.get("/camp/login",function(req,res){
	res.render("campAdminLogin.ejs");
});
app.post("/camp/login",function(req,res){
	connection.query("SELECT * FROM camp where camp_id = \""+req.body.cid+"\";",function(error,camp,fields){
		if(error){
			console.log(error)
			res.redirect("/camp/login")
		}else{
			console.log(req.body.cid +" : "+camp[0].password)
			if(camp[0].password===req.body.password){
				res.redirect("/camp/"+req.body.cid)
			}else{
				console.log("Wrong password");
				res.redirect("/camp/login")
			}
		}
	})
});
app.get("/camp/:id",function(req,res){
	
	connection.query("SELECT * FROM camp WHERE camp_id = \""+req.params.id + "\";",function(error,foundcamp,fields){
		if(error){
			console.log("Error");
		}else{
			console.log("query worked!!")
			foundcamp[0].active_from = String(foundcamp[0].active_from) 
			foundcamp[0].active_from = foundcamp[0].active_from.slice(0,24)
			console.log(foundcamp[0].active_from)
			console.log(foundcamp);
			connection.query("SELECT * FROM survivor WHERE camp_id = \""+req.params.id + "\";",function(error,survivors,fields){
				if(error){
					console.log("Error"+error);
				}else{
					console.log("retrieving survivors for camp ")
					console.log(survivors)
					connection.query("SELECT * FROM resource_list ORDER BY category;",function(error,resources,fields){
						if(error){
							console.log("Error retrieving resource list :"+error)
						}else{
							connection.query("SELECT DISTINCT category FROM resource_list",function(error,category,fields){
								if(error){
									console.log("Error retrieving resource category :"+error)
								}else{
									CampResource.findOne({Cid:req.params.id},function(err,obj){
										if(err){
											console.log("Cannot find camp resources")
											console.log(err)
										}else{
											res.render("campinfo.ejs",{camp:foundcamp[0],
																survivors  :survivors,
																resource   :resources,
																cat        :category,
																requested  :obj.requested,
																allocated  :obj.allocated
															});
										}

									})
									
								}
							})
							
						}
					})
					
				}
			})
			
		}
	})
});
app.get("/camp/:id/request",function(req,res){
					console.log(req.params.id)

					connection.query("SELECT * FROM resource_list ORDER BY category;",function(error,resources,fields){
						if(error){
							console.log("Error retrieving resource list :"+error)
						}else{
							connection.query("SELECT DISTINCT category FROM resource_list",function(error,category,fields){
								if(error){
									console.log("Error retrieving resource category :"+error)
								}else{
									res.render("request.ejs",{	camp_id:req.params.id,
																resource:resources,
																cat:category});
								}
							})
							
						}
					})
	
})


app.post("/camp/:id/request",function(req,res){
	query1 = "SELECT * FROM resource_list"+";"
	console.log(req.params.id)
	connection.query(query1,function(error,resources,fields){
		if(error){
			console.log("Not able to find resources table")
			console.log(err)
		}else{
			r_ids = []
			quantities = []
			imps= []
			for (var i = 0; i <resources.length; i++) {
				console.log(resources[i].r_id)
				console.log(req.body[resources[i].r_id + "q"])
				if(Number(req.body[resources[i].r_id + "q"])>0){
					r_ids.push(resources[i].r_id)
					quantities.push(Number(req.body[resources[i].r_id+"q"]))
					imps.push(Number(req.body[resources[i].r_id+"i"]))
				}
			}
			console.log("Requested resources : ")
			console.log(r_ids)
			console.log(imps)
			console.log(quantities)
			var camp_id = req.params.id
			console.log(camp_id)
			CampResource.findOne({Cid:camp_id},function(err,obj){
				if(err){
					console.log(err)
					console.log("Unable to find camp")
				}else{
					
					console.log(obj)
					for(var j=0;j<r_ids.length;j++){
						var flag = 0 
						for (var i = 0; i <obj.requested.length; i++) {
							if(obj.requested[i].Rid==r_ids[j]){
								flag = 1
								obj.requested[i].quantity+=quantities[j]
								obj.requested[i].imp=imps[j]

							}
						}
						if(flag==0){
							var name     = ""
							var category = ""
							for (var i = 0; i < resources.length; i++) {
								if(r_ids[j]==resources[i].r_id){
									name = resources[i].r_name
									category = resources[i].category
									break
								}
								
							}
							obj.requested.push({
								Rid      : r_ids[j],
								imp      : imps[j],
								quantity : quantities[j],
								name     : name,
								category : category

							})
						}
					}
					console.log(obj)
					obj.save()
				}
			})

		}

	})
});


app.post("/camp/:id/filter",function(req,res){
	var cond1 = req.body.gender
	var cond2 = req.body.age
	var cond3 = req.body.city
	var squery = "SELECT * FROM survivor WHERE camp_id = \""+req.params.id + "\"" 
	if(cond1!="0"){
		if(cond1=="1"){
			squery+=" And sex =\"male\" "
		}else{
			squery+=" And sex =\"female\" "
		}
	}
	if(cond2!="0"){
		if(cond2 == "1"){
			squery+=" And age BETWEEN 10 AND 20"
		}
		else if(cond2 == "2"){
			squery+=" And age BETWEEN 20 AND 30"
		}
		else if(cond2 == "3"){
			squery+=" And age BETWEEN 30 AND 40"
		}
		else if(cond2 == "4"){
			squery+=" And age BETWEEN 40 AND 50"
		}
		else if(cond2 == "5"){
			squery+=" And age BETWEEN 40 AND 60"
		}
		else if(cond2 == "6"){
			squery+=" And age>60"
		}

	}
	if(cond3!=""){
		squery+=" And city = \""+cond3+"\""
	}
	squery+=";"
	console.log(squery)
	connection.query("SELECT * FROM camp WHERE camp_id = \""+req.params.id + "\";",function(error,foundcamp,fields){
		if(error){
			console.log("Error");
		}else{
			console.log("query worked!!")
			foundcamp[0].active_from = String(foundcamp[0].active_from) 
			foundcamp[0].active_from = foundcamp[0].active_from.slice(0,24)
			console.log(foundcamp[0].active_from)
			console.log(foundcamp);
			connection.query(squery,function(error,survivors,fields){
				if(error){
					console.log("Error"+error);
				}else{
					console.log("retrieving survivors for camp ")
					console.log(survivors)
					connection.query("SELECT * FROM resource_list ORDER BY category;",function(error,resources,fields){
						if(error){
							console.log("Error retrieving resource list :"+error)
						}else{
							connection.query("SELECT DISTINCT category FROM resource_list",function(error,category,fields){
								if(error){
									console.log("Error retrieving resource category :"+error)
								}else{
									CampResource.findOne({Cid:req.params.id},function(err,obj){
										if(err){
											console.log("Cannot find camp resources")
											console.log(err)
										}else{
											res.render("campinfo.ejs",{camp:foundcamp[0],
																survivors  :survivors,
																resource   :resources,
																cat        :category,
																requested  :obj.requested,
																allocated  :obj.allocated
															});
										}

									})
									
								}
							})
							
						}
					})
					
				}
			})
			
		}
	})
})
app.post("/camp/:id/new",function(req,res){
	var sid =""
	connection.query("SELECT * FROM survivor;",function(error,survivors,fields){
		if(error){
			console.log("Error");
		}else{
			console.log("query worked!! assigning sid...")

			sid = "SID"+String(survivors.length+1000000)
			console.log(sid)
			console.log(req.body.fname)
			var query = "INSERT INTO survivor VALUES (\""+
						sid+"\""+","+
						"\""+req.params.id+"\""+" ,"+
						"\""+req.body.fname +"\""+" ,"+
						"\""+req.body.sname +"\""+" ,"+
						"\""+req.body.sex +"\""+" ,"+
						"\""+req.body.city +"\""+" ,"+
						"\""+req.body.state +"\""+" ,"+
						Number(req.body.zip) +" ,"+
						Number(req.body.age) + ");";

			connection.query(query,function(error,survivor){
				if(error){
					console.log(query)
					console.log("Error\n" +error);
				}else{
					console.log("adding new survivor...")
					console.log(query)
					res.redirect("/camp/"+req.params.id)
				}
			})
		}
	})
})



app.listen(1111);


// app.post("/camp/new",function(req,res){
	
// 	query = "SELECT * FROM camp_admin WHERE admin_id =\" " + req.body.admin_id + "\" ;"
// 	connection.query(query,function(error,admin,fields){
// 		if(error){
// 			console.log("Error retrieving admin :");
// 			console.log(error);
// 			res.redirect("/camp/new");
		
// 		}else{
// 			if(req.body.password === admin[0].password ){
// 				console.log("Admin logged in successfully !!");
// 				var cid = ""
// 				connection.query("SELECT * FROM camp;",function(error,camps,fields){
// 					if(error){
// 						console.log("Error");
// 					}else{
// 						console.log("query worked!! assigning cid...")

// 						cid = "CID"+String(camps.length+1000000)
// 						console.log(cid)
						
// 						var query1 = "INSERT INTO camp VALUES (\""+
// 									cid+"\""+","+
// 									"\""+req.body.admin_id+"\""+" ,"+
// 									"\""+req.body.location +"\""+" ,"+
// 									"\""+req.body.longitude +"\""+" ,"+
// 									"\""+req.body.latitude +"\""+" ,"+
// 									"\""+req.body.threat_level +"\""+" ,"+
// 									"\""+req.body.active_from +"\""+" ,"+
// 									0 +" ,"+
// 									req.body.password + ");";

// 						connection.query(query1,function(error,camp){
// 							if(error){
// 								console.log(query)
// 								console.log("Error\n" +error);
// 							}else{
// 								console.log("adding new camp...")
// 								console.log(query)
// 								res.redirect("/camp/"+req.params.id)
// 							}
// 						})
// 					}
// 				})	
// 			}
// 		}
// 	})	
// })
