var express               = require('express')
var app                   = express()
var mysql 				  = require('mysql')
var bodyParser            = require("body-parser");
var request               = require("request");
var nodemailer            = require('nodemailer');
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


var transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'newgenrick@gmail.com',
        pass: ''
    }
});

function hash(str){
	var h = 0
	for(var i = 0;i<str.length;i++){
		h=h+str.charCodeAt(i)*str.charCodeAt(i)
	}
	return h
}
app.get("/",function(req,res){
	
	console.log(hash("abhi"))
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
	query = "SELECT * FROM survivor;"
	connection.query(query,function(error,survivors,fields){
		if(error){
			console.log(error)
			console.log("Error retrieving survivors data")
		}else{
			res.render("query.ejs",{survivor:survivors,flag:0})
		}
	})
	
})
app.post("/query",function(req,res){
	cond1 = "fname=\""+req.body.fname+"\""
	cond2 = "sname=\""+req.body.sname+"\""
	cond3 = "age="+req.body.age
	cond4 = "sex=\""+req.body.sex+"\""
	cond5 = "city=\""+req.body.city+"\""
	squery = "SELECT * FROM survivor WHERE " +cond1 +" AND "+cond2+" AND "+cond3+" AND "+cond4+" AND "+cond5
	console.log(squery)
	connection.query(squery,function(error,survivors,fields){
		if(error){
			console.log(error)
			console.log("Error retrieving survivors data")
		}else{
			res.render("query.ejs",{survivor:survivors,flag:1})
		}
	})

})
app.post("/query/filter",function(req,res){
	var cond1 = req.body.gender
	var cond2 = req.body.age
	var cond3 = req.body.city
	var squery = "SELECT * FROM survivor WHERE survivor_id IS NOT NULL" 
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
	connection.query(squery,function(error,survivors,fields){
		if(error){
			console.log(error)
			console.log("Error retrieving survivors data")
		}else{
			res.render("query.ejs",{survivor:survivors,flag:0})
		}
	})

})
app.get("/query/notfound",function(req,res){
	res.render("notfound.ejs")
})
app.post("/query/notfound",function(req,res){
					var mquery = "SELECT * FROM missing_list;"
					connection.query(mquery,function(error,missing,fields){
						if(error){
							res.redirect("/query/notfound")
						}else{
							mid = 10000 + missing.length
							mid = "MID"+String(mid)
							var query = "INSERT INTO missing_list VALUES ("+
												"\""+mid +"\""+" ,"+
												"\""+req.body.fname +"\""+" ,"+
												"\""+req.body.sname +"\""+" ,"+
												Number(req.body.age) + " ,"+
												"\""+req.body.sex +"\""+" ,"+
												"\""+req.body.city +"\""+" ,"+
												Number(req.body.zip) +" ,"+
												"\""+req.body.state +"\""+" ,"+
												"\""+req.body.email_id+"\""+");";
							console.log(query)

							connection.query(query,function(error,report){
								if(error){
									console.log(error)
								}else{
									console.log("Missing report filed")
									console.log(report)
									res.redirect("/query")
								}
							})
							
						}
					})

	



})
app.get("/adminlogin",function(req,res){
	res.render("adminlogin.ejs")
})
app.post("/adminlogin",function(req,res){
	var query = "SELECT * FROM camp_admin WHERE admin_id = \""+req.body.admin_id+"\";"
	console.log(query)
	connection.query(query,function(error,admin,fields){
		if(error){
			console.log("error")
			console.log("not able to find admin details");
			res.redirect("/adminlogin")
		}else{
			console.log(admin)
			if(admin[0].password!=req.body.password){
				console.log(admin[0].password)
				console.log(req.body.password)
				res.redirect("/adminlogin")
			}else{
				res.redirect("/camp/new/"+admin[0].admin_id)
			}
		}
	}) 
})
app.get("/camp/new/:id",function(req,res){
	res.render("campRegistration.ejs",{admin_id:req.params.id});
});


app.post("/camp/new/:id",function(req,res){
	
				var cid = ""
				connection.query("SELECT * FROM camp;",function(error,camps,fields){
					if(error){
						console.log("Error");
					}else{
						console.log("query worked!! assigning cid...")

						cid = "CID"+String(camps.length+1000000)
						console.log(cid)
						var active_from = String(new Date())
						var query1 = "INSERT INTO camp VALUES (\""+
									cid+"\""+","+
									"\""+req.params.id+"\""+" ,"+
									"\""+req.body.location +"\""+" ,"+
									"\""+req.body.longitude +"\""+" ,"+
									"\""+req.body.latitude +"\""+" ,"+
									"\""+req.body.threat +"\""+" ,"+
									"\""+active_from +"\""+" ,"+
									0 +" ,"+
									"\""+hash(req.body.password) +"\""+ ");";
						console.log(query1)
						connection.query(query1,function(error,camp){
							if(error){
								console.log(query1)
								console.log("Error\n" +error);

							}else{
								console.log("adding new camp...")
								console.log(query1)
								CampResource.create({
									Cid : cid,
									requested : [],
									allocated : []
								})
								res.redirect("/camp/"+cid)

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
			if(camp[0].password==hash(req.body.password)){
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
											connection.query("SELECT * FROM camp_admin WHERE admin_id=\""+foundcamp[0].admin_id+"\";",function(error,admin,fields){
												if(error){
													console.log(error)
												}else{
													res.render("campinfo.ejs",{
																camp       :foundcamp[0],
																survivors  :survivors,
																resource   :resources,
																cat        :category,
																requested  :obj.requested,
																allocated  :obj.allocated,
																admin_name :admin[0].fname
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
					res.redirect("/camp/"+req.params.id+"/request")
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
											connection.query("SELECT * FROM camp_admin WHERE admin_id=\""+foundcamp[0].admin_id+"\";",function(error,admin,fields){
												if(error){
													console.log(error)
												}else{
													res.render("campinfo.ejs",{
																camp       :foundcamp[0],
																survivors  :survivors,
																resource   :resources,
																cat        :category,
																requested  :obj.requested,
																allocated  :obj.allocated,
																admin_name :admin[0].fname
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
					var missingquery = "SELECT * FROM missing_list WHERE fname = \""+req.body.fname +"\""+" AND sname=\""+req.body.sname +"\""+" AND age="+req.body.age+";"
					console.log(missingquery)
					connection.query(missingquery,function(error,report,fields){
						console.log(report)
						if(report.length>0){
							var htmlMessage = '<h3>update on '+ report[0].fname+ "\'s Missing report,</h3> <p>A similar survivor data has been recorded in our database, please check survivor query page to confirm identity of survivor <a href=\"/query\">here</a>.</p>"
				             reciever = report[0].email_id
				             console.log(reciever)
				             var mailOptions = {
				            
				              from: '"DRMS INDIA" newgenrick@gmail.com', // sender address
				              to: reciever , // list of receivers
				              subject: 'Missing report update : '+report[0].rep_id, // Subject line
				              html: htmlMessage// plain text body
				            };
				            transporter.sendMail(mailOptions, function (err, info) {
				               if(err){
				                 console.log(err)
				                 res.redirect("/camp/"+req.params.id)
				               }
				               else{
				                 console.log(info);
				                 res.redirect("/camp/"+req.params.id)
				               }
				            }); 
				            res.redirect("/camp/"+req.params.id)
						}else{
							res.redirect("/camp/"+req.params.id)
						}
					})
					
					
				}
			})
		}
	})
})

app.get("/virtualcr",function(req,res){
	query = "SELECT * FROM camp"
	connection.query(query,function(error,camps,fields){
		if(error){
			console.log(error)
			console.log("Not able to retrieve camp info.")
		}else{
			console.log(camps)
			squery = "SELECT * FROM survivor"
			connection.query(squery,function(error,survivors,fields){
				if(error){
					console.log(error)
					res.redirect("/")
				}else{
					var mquery = "SELECT * FROM missing_list;"
					connection.query(mquery,function(error,missing,fields){
						if(error){
							res.redirect("/")
						}else{
							res.render("virtualCR.ejs",{camp:camps,
												survivors:survivors,
												missing:missing})
						}
					})
				}
			})
			
		}
	})
})
app.post("/virtualcr/sort",function(req,res){
	console.log("sort route")
	var cond1 = req.body.order 
	var cond2 = req.body.property
	sortquery = "SELECT * FROM camp ORDER BY "
	if(cond2=="1"){
		sortquery+="survivor_count "
	}else{
		sortquery+="threat_level "
	}
	if(cond1=="1"){
		sortquery+="ASC"
	}else{
		sortquery+="DESC"
	}
	console.log(sortquery)
	connection.query(sortquery,function(error,camps,fields){
		if(error){
			console.log(error)
			console.log("Not able to retrieve camp info.")
		}else{
			console.log(camps)
			squery = "SELECT * FROM survivor"
			connection.query(squery,function(error,survivors,fields){
				if(error){
					console.log(error)
					res.redirect("/")
				}else{
					var mquery = "SELECT * FROM missing_list;"
					connection.query(mquery,function(error,missing,fields){
						if(error){
							res.redirect("/")
						}else{
							res.render("virtualCR.ejs",{camp:camps,
												survivors:survivors,
												missing:missing})
						}
					})
					
				}
			})
			
		}
	})
})
app.post("/virtualcr/filter",function(req,res){
	var cond1 = req.body.gender
	var cond2 = req.body.age
	var cond3 = req.body.city
	var squery = "SELECT * FROM survivor WHERE camp_id IS NOT NULL" 
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
	query = "SELECT * FROM camp"
	connection.query(query,function(error,camps,fields){
		if(error){
			console.log(error)
			console.log("Not able to retrieve camp info.")
		}else{
			console.log(camps)
			//squery = "SELECT * FROM survivor"
			connection.query(squery,function(error,survivors,fields){
				if(error){
					console.log(error)
					res.redirect("/")
				}else{
					var mquery = "SELECT * FROM missing_list;"
					connection.query(mquery,function(error,missing,fields){
						if(error){
							res.redirect("/")
						}else{
							res.render("virtualCR.ejs",{camp:camps,
												survivors:survivors,
												missing:missing})
						}
					})
				}
			})
			
		}
	})
})
app.get("/virtualcr/resourcestat",function(req,res){
	//res.render("resourcestat.ejs")
	query = "SELECT * FROM resource_list"
	connection.query(query,function(error,resr,fields){
		if(error){
			console.log("Not able to find resource stats")
			res.redirect("/virtualcr")
		}else{
			res.render("resourcestat.ejs",{resource:resr});
		}
	})
})
// app.get("/virtualcr/resourcestat",function(req,res){
// 	//res.send("fuck")
// 	res.render("resourcestat.ejs");
// 	query = "SELECT * FROM resource_list;"
// 	connection.query(query,function(error,res,fields){
// 		if(error){
// 			console.log("Not able to find resource stats")
// 			res.redirect("/virtualcr")
// 		}else{
// 			res.render("resourcestat.ejs",{res:res});
// 		}
// 	})
// })
app.post("/virtualcr/allocate",function(req,res){
	cid = req.body.cid
	res.redirect("/virtualcr/allocate/"+cid)

})

app.get("/virtualcr/allocate/:id",function(req,res){
	CampResource.findOne({Cid:req.params.id},function(err,obj){
		if(err){
			console.log("Cannot find camp resources")
			console.log(err)
		}else{
			res.render("allocation.ejs",{
				requested : obj.requested,
				allocated : obj.allocated,
				camp_id   : req.params.id
			})
		}
	})
})
app.post("/virtualcr/allocate/:id",function(req,res){
	CampResource.findOne({Cid:req.params.id},function(err,obj){
		if(err){
			console.log("Cannot find camp resources")
			console.log(err)
			res.redirect("/virtualcr")
		}else{
			for(var i=0;i<obj.requested.length;i++){
				if(Number(req.body[obj.requested[i].Rid])>0){
					obj.requested[i].quantity-=Number(req.body[obj.requested[i].Rid])
					var flag=0
					for(var j=0 ;j<obj.allocated.length;j++){
						if(obj.requested[i].Rid==obj.allocated[j].Rid){
							flag=1
							obj.allocated[i].quantity+=Number(req.body[obj.requested[i].Rid])
							break
						}
					}
					if(flag==0){
						obj.allocated.push({
							Rid      : obj.requested[i].Rid,
							imp      : obj.requested[i].imp,
							quantity : Number(req.body[obj.requested[i].Rid]),
							name     : obj.requested[i].name,
							category : obj.requested[i].category
						})
					}
				}
			}
			console.log(obj)
			obj.save()
			res.redirect("/virtualcr/allocate/"+req.params.id)
		}
	})
})
app.get("*",function(req,res){
	res.render("error.ejs")
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
