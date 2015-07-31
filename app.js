var express = require('express');
var app = require('express')();
var server = require('http').Server(app).listen(8080);;
var io = require('socket.io')(server);
var fs = require('fs');
var ejs = require('ejs');
var async = require('async');
var multer  = require('multer');
var Cookies = require('cookies');
var bodyParser = require('body-parser');
var mysql      = require('mysql');
var utf8 = require('utf8');
var email   = require('emailjs');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var favicon = require('serve-favicon'); // Charge le middleware de favicon
var read = require('fs').readFileSync;
var PDFDocument = require('pdfkit');
// var blobStream = require('blob-stream');


/*#######################################################################
###########    function        ##############################
#######################################################################*/

function setMajToAllWords(toFirstWord, texte){
		var newText = (toFirstWord == true) ? texte.charAt(0).toUpperCase() : texte.charAt(0);
		for (var i=0 ; i<texte.length-1 ; i++){
			if (texte.charAt(i).match(/\s/) && texte.charAt(i+1).match(/[a-z]/)){
				newText += texte.charAt(i+1).toUpperCase();
			} else {
				newText += texte.charAt(i+1);
			}
		}
		return newText;
}
function getName(c) {

cLenght = c.lastIndexOf("-");
cName = c.substring(c.indexOf("-",0)+1,cLenght);
cName = cName.toLowerCase();
cName = setMajToAllWords(true,cName);
return cName;
}


function getMat(c) {
cMat = c.substring(0,c.indexOf("-",0));
return cMat;
}

Date.prototype.getWeek = function() {
var onejan = new Date(this.getFullYear(),0,1);
return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
} 

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

today = new Date();

function toFrDate(dt) {
	d = new Date(dt);
	dYear = d.getFullYear();
	dMonth = d.getMonth();
	dMonth++;
	dMonth = addZero(dMonth);
	dDay = d.getDate();
	return addZero(dDay) + '/' + dMonth + '/' + dYear;
}

function shortDate(dt) {
	d = new Date(dt);
	dMonth = d.getMonth();
	dMonth++;
	dMonth = addZero(dMonth);
	dDay = d.getDate();
	return addZero(dDay) + '/' + dMonth ;
}

/*####################################################################### 
###########    Déclaration des dossiers publics        ##############################
#######################################################################*/

app.set('view engine', 'ejs'); 	
app.use(express.static(__dirname + '/public'));
app.use(express.static('../public'));
app.use(favicon(__dirname + '/public/images/css/logofives.ico')) // Active la favicon indiquée

/*#######################################################################
###########    Connexion à pointages        ##############################
#######################################################################*/

var connectphc = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'phc',
  charset: 'utf8_general_ci',
  multipleStatements: true
});

connectphc.connect();

io.sockets.on('connection', function (socket) {
/*#######################################################################
###########    socket validation chef de service                  ##############################
#######################################################################*/

socket.on('vcs', function (vcs) {
	var query = connectphc.query('SELECT * FROM phc WHERE id = ' + vcs.thisId + ' ',function(err,result) {
	if (result[0].vcs == 0) {
	connectphc.query('UPDATE phc SET vcs = 1, vcsName = "' + vcs.vcsHiddenCookie + '" WHERE id = ' + vcs.thisId + ' ');
	connectphc.query('UPDATE phcp SET vcs = 1, vcsName = "' + vcs.vcsHiddenCookie + '" WHERE id = ' + vcs.thisId + ' ');
	
	}
	else if (result[0].vcs == 1) {
	connectphc.query('UPDATE phc SET vcs = 0, vcsName = NULL WHERE id = ' + vcs.thisId + ' ');
	connectphc.query('UPDATE phcp SET vcs = 0, vcsName = NULL WHERE id = ' + vcs.thisId + ' ');
	}
	var query2 = connectphc.query('SELECT * FROM phc  ORDER BY phc.phcDate desc,phc.id desc',function(err,result2) {
	str = fs.readFileSync('./views/controlGrid.ejs','utf8');
	var template = ejs.render(str, {result2: result2,mycookie : vcs.vcsHiddenCookie });
   io.sockets.emit('vcsReturn',template);
	});
	});
});


/*#######################################################################
###########    socket modification de phc                  ##############################   
#######################################################################*/

socket.on('updatephc', function (updatephc) {
if (updatephc.control == "control") {
sql = 'SELECT * FROM phc WHERE id = ' + updatephc.thisId + ' ';}
else if (updatephc.control == "owner") {
sql = 'SELECT * FROM phcp WHERE id = ' + updatephc.thisId + ' ';}
	var query = connectphc.query(sql,function(err,result) {
str = fs.readFileSync('./views/updateForm.ejs','utf8');
	var template = ejs.render(str, {result: result , mycookie : updatephc.vcsHiddenCookie });
	socket.emit('phcFormUpdate',template);
	}); 
});	
/*#######################################################################
###########   fin socket on connection                  ##############################
#######################################################################*/

});


app


/*#######################################################################
###########    Index pointages                  ##############################
#######################################################################*/

.get('/pointage/',  function(req, res, next) {
   res.header('Content-Type', 'text/html;charset=utf-8');
  cookies = new Cookies(req,res);
  infobuCookie = cookies.get( "infobuCookie" );
  var logMat = "";
  if (typeof(infobuCookie) == 'undefined') {cookieVal = undefined;}
	else {cookieVal =utf8.decode(infobuCookie);
	logMat = getMat(infobuCookie);}
	
	query1 = 'SELECT * FROM phcp  ORDER BY phcp.phcDate desc,phcp.id desc';
	query2 = 'SELECT * FROM phc  ORDER BY phc.phcDate desc,phc.id desc';
	query = query1 + ";" + query2;
var query = connectphc.query(query,function(err,result) {
   res.render('pointageIndex.ejs', {result : result[0],result2 : result[1],mycookie: cookieVal}); 
	// console.log(result[0]);
});
   
})

/*#######################################################################
###########    Enregistrer la feuille de pointage        ##############################
#######################################################################*/

.post('/savephc/', urlencodedParser,function (req, res) {
	
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}


		cookies = new Cookies(req,res);
		infobuCookie = cookies.get( "infobuCookie" );
		if (typeof(infobuCookie) == 'undefined') {cookieVal = undefined;}
	else {cookieVal =utf8.decode(infobuCookie);}
		thisDate = new Date();
		thisYear = thisDate.getFullYear();
		thisMonth = thisDate.getMonth();
		thisMonth++;
		thisMonth = addZero(thisMonth);
		thisDay = thisDate.getDate();
		thisDay = addZero(thisDay);
		myDate = thisYear + '-' + thisMonth + '-' + thisDay;
						
var maxIdquery = connectphc.query('SELECT COUNT(id) AS countId , MAX(id) AS maxId FROM phcp',function(err,result) {
	if (result[0].countId > 0) {
		
		newId = result[0].maxId;
		newId++;
		}
	else {newId = 1;}
	
var insertId = connectphc.query('INSERT INTO phcp (id,phcDate,phcName,phcControl) VALUES (' + newId + ',"' + myDate +'","' + cookieVal +'",0) ');
	if (req.body.hiddenphcaction == "send") {
		var insertIds = connectphc.query('INSERT INTO phc (id,phcDate,phcName,phcControl) VALUES (' + newId + ',"' + myDate +'","' + cookieVal +'",1) ');
		}
		for(e in req.body) {
	if (e.substring(0,3) == "dat") {
		
		thisYear = req.body[e].substring(6,10);
		thisMonth = req.body[e].substring(3,5);
		thisDay = req.body[e].substring(0,2);
		myDate = thisYear + '-' + thisMonth + '-' + thisDay;
		
			req.body[e] = myDate;
			}
var updateInfo = connectphc.query('UPDATE phcp SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + newId + ' ');
	
	if (req.body.hiddenphcaction == "send") {
			var updateInfos = connectphc.query('UPDATE phc SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + newId + ' ');
		}
	};
});	
  

	 res.redirect('/pointage/');
})

/*#######################################################################     
###########    modifier la feuille de pointage        ##############################
#######################################################################*/

.post('/updatephc/', urlencodedParser,function (req, res) {
	
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}


		cookies = new Cookies(req,res);
		infobuCookie = cookies.get( "infobuCookie" );
		if (typeof(infobuCookie) == 'undefined') {cookieVal = undefined;}
	else {cookieVal =utf8.decode(infobuCookie);}
		thisDate = new Date();
		thisYear = thisDate.getFullYear();
		thisMonth = thisDate.getMonth();
		thisMonth++;
		thisMonth = addZero(thisMonth);
		thisDay = thisDate.getDate();
		thisDay = addZero(thisDay);
		myDate = thisYear + '-' + thisMonth + '-' + thisDay;
//#################################           si modification par le chef ou le contôle       #########################################################	
	if (req.body.phcControl == 1) {
			for(e in req.body) {
				if (e.substring(0,3) == "dat") {
		
					thisYear = req.body[e].substring(6,10);
					thisMonth = req.body[e].substring(3,5);
					thisDay = req.body[e].substring(0,2);
					myDate = thisYear + '-' + thisMonth + '-' + thisDay;
					
						req.body[e] = myDate;
						}
var updateInfo = connectphc.query('UPDATE phc SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + req.body.hiddenphcId + ' ');
		var updateControl = connectphc.query('UPDATE phc SET phcControl = 1 WHERE id = ' + req.body.hiddenphcId + ' ');
		var updateControl = connectphc.query('UPDATE phc SET hiddenphcaction = "send" WHERE id = ' + req.body.hiddenphcId + ' ');
		}
		
	}
//#################################           si modification par le salarié       #########################################################	
	
	if (req.body.phcControl == 0) {
		
var vcsCheck = connectphc.query('SELECT vcs  FROM phcp WHERE id = ' + req.body.hiddenphcId + ' ',function(err,vcs) {
	//si le chef de service n'a pas encore validé
				if (vcs[0].vcs == 0) {
					sendquery = connectphc.query('SELECT COUNT(id) AS countphc FROM phc WHERE id = ' + req.body.hiddenphcId + ' ',function(err,sendresult) {
						if (sendresult[0].countphc > 0) {
					for(e in req.body) {
						if (e.substring(0,3) == "dat") {
				
							thisYear = req.body[e].substring(6,10);
							thisMonth = req.body[e].substring(3,5);
							thisDay = req.body[e].substring(0,2);
							myDate = thisYear + '-' + thisMonth + '-' + thisDay;
							req.body[e] = myDate;
						}
						var updateInfo = connectphc.query('UPDATE phcp SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + req.body.hiddenphcId + ' ');
						var updateControl = connectphc.query('UPDATE phcp SET hiddenphcaction = "send" WHERE id = ' + req.body.hiddenphcId + ' ');
						if (req.body.hiddenphcaction == "send") {
							var updateInfos = connectphc.query('UPDATE phc SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + req.body.hiddenphcId + ' ');
							var updateControl = connectphc.query('UPDATE phc SET phcControl = 1 WHERE id = ' + req.body.hiddenphcId + ' ');
						}
			}
			
		}
				else {
					if (req.body.hiddenphcaction == "send") {
						insertInfos = connectphc.query('INSERT INTO phc (id,phcDate,phcName) VALUES (' + req.body.hiddenphcId + ',"' + myDate +'","' + cookieVal +'") ');
					}
						for(e in req.body) {
						if (e.substring(0,3) == "dat") {
				
							thisYear = req.body[e].substring(6,10);
							thisMonth = req.body[e].substring(3,5);
							thisDay = req.body[e].substring(0,2);
							myDate = thisYear + '-' + thisMonth + '-' + thisDay;
							req.body[e] = myDate;
						}
var updateInfo = connectphc.query('UPDATE phcp SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + req.body.hiddenphcId + ' ');
if (req.body.hiddenphcaction == "send") {
	
		
			var upInfos = connectphc.query('UPDATE phc SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + req.body.hiddenphcId + ' ');
			var updateControl = connectphc.query('UPDATE phc SET phcControl = 1 WHERE id = ' + req.body.hiddenphcId + ' ');
				}
			}
			}	
	});
}
		
else if (vcs[0].vcs == 1) {
	var maxIdquery = connectphc.query('SELECT  MAX(id) AS maxId FROM phcp',function(err,result) {
			
		newId = result[0].maxId;
		newId++;
	
	
var insertId = connectphc.query('INSERT INTO phcp (id,phcDate,phcName,phcControl) VALUES (' + newId + ',"' + myDate +'","' + cookieVal +'",0) ');
	if (req.body.hiddenphcaction == "send") {
		var insertIds = connectphc.query('INSERT INTO phc (id,phcDate,phcName,phcControl) VALUES (' + newId + ',"' + myDate +'","' + cookieVal +'",1) ');
		}
		for(e in req.body) {
	if (e.substring(0,3) == "dat") {
		
							thisYear = req.body[e].substring(6,10);
							thisMonth = req.body[e].substring(3,5);
							thisDay = req.body[e].substring(0,2);
							myDate = thisYear + '-' + thisMonth + '-' + thisDay;
							req.body[e] = myDate;
							}
			var updateInfo = connectphc.query('UPDATE phcp SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + newId + ' ');
				
				if (req.body.hiddenphcaction == "send") {
			var updateInfos = connectphc.query('UPDATE phc SET ' + e + ' = "' + req.body[e] +'" WHERE id = ' + newId + ' ');
					}
				};
			
	var updateControl = connectphc.query('UPDATE phcp SET phcControl = 0 WHERE id = ' + req.body.hiddenphcId + ' ');
	if (req.body.hiddenphcaction == "send") {
		var updateControl = connectphc.query('UPDATE phc SET phcControl = 1 WHERE id = ' + newId + ' ');
				}
			});	
		}
	}); 
}
	 res.redirect('/pointage/');
})

/*#######################################################################
###########    imprimer feuille envoyée                  ##############################
#######################################################################*/
.get('/print/:id/:control/',function(req, res) {

var doc = new PDFDocument({size : "A4",
			margins: {
            top: 70,
            bottom: 70,
            left: 70,
            right: 70
        },
        layout: 'portrait'
		});
if (req.params.control == "control") {
sql = 'SELECT * FROM phc WHERE id = ' + req.params.id + ' ';}
else if (req.params.control == "owner") {
sql = 'SELECT * FROM phcp WHERE id = ' + req.params.id + ' ';}
	var query = connectphc.query(sql,function(err,result) {
		
	thisMat = getMat(result[0].phcName);	
	
if (result[0].dat1 !== "0000-00-00") {thisYear = result[0].dat1.getFullYear();thisweek = result[0].dat1.getWeek();}
else if (result[0].dat2 !== "0000-00-00") {thisYear = result[0].dat2.getFullYear();thisweek = result[0].dat2.getWeek();}
else if (result[0].dat3 !== "0000-00-00") {thisYear = result[0].dat3.getFullYear();thisweek = result[0].dat3.getWeek();}
else if (result[0].dat4 !== "0000-00-00") {thisYear = result[0].dat4.getFullYear();thisweek = result[0].dat4.getWeek();}
else if (result[0].dat5 !== "0000-00-00") {thisYear = result[0].dat5.getFullYear();thisweek = result[0].dat5.getWeek();}
else if (result[0].dat6 !== "0000-00-00") {thisYear = result[0].dat6.getFullYear();thisweek = result[0].dat6.getWeek();}
else if (result[0].dat7 !== "0000-00-00") {thisYear = result[0].dat7.getFullYear();thisweek = result[0].dat7.getWeek();}
else  {thisYear = result[0].phcDate.getFullYear();thisweek = result[0].phcDate.getWeek();}

  var logofives = 'public/images/css/logo.png';
    doc.image(logofives,500,10,{width: 80});
	//en-tete
	doc.moveDown();
	var fontPath = '/public/fonts/';
	doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(13);
	myText = 'FEUILLE DE POINTAGE HEBDOMADAIRE ' + today.getFullYear();
	doc.text(myText, (doc.page.width - doc.widthOfString(myText)) / 2 );
	doc.moveDown();
	doc.fontSize(11);
	y=doc.y;
	doc.text('Nom : ' + getName(result[0].phcName),25);
	doc.text('Semaine : ' + thisweek,325,y);
	doc.moveDown();
	y=doc.y;
	doc.text('Matricule : ' + thisMat,25);
	servQuery = connectphc.query('SELECT service FROM personnel WHERE mat = "' + thisMat + '" ',function(err,serv) {
	doc.text('Service : ' + serv[0].service,325,y);
	doc.moveDown();
	// tableau
	xi = 25;
	x = xi;
	y = doc.y;
	w = 200;
	h = 20;
	pad = 2;
	doc.text('CLIENT',x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.lineWidth(0.75).rect(x,y,w,h+pad*2).stroke();
	
	yi = y + h + pad*2; // ###################################       y pour 2ème ligne
	
	x= x + w*1.75;
	w = 150;
	h = 10;
	doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(6);
	doc.rotate(270,{origin :[x,y+w]}).text('Non respect du délai de prévenance',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	doc.rotate(-270,{origin :[x,y+w]});
	x= x-w+h+pad*2;
	w = 42;
	h = 40 + pad*2;
	doc.text('Astreinte',x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	x = x + w;
	w = 35;
	h = 20;
	
	for (i = 1; i < 6 ; i++) {
		k = i.toString();
		cli = 'cli' + k;
		client = "result[0]." + cli;
		doc.text(eval(client) ,x,y+pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
		x = x + w;
		}
		
	
	h = 10;
	w = 150;
	x= x + w;
	doc.rotate(270,{origin :[x,y+w]}).text('Congé détente',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('Férié',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('Démodulation / RTT',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('Jour Initiative Salarié (JIS)',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('CP',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('Maladie / AT',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	doc.rotate(-270,{origin :[x,y+w]});
	x= x-w+h+pad*2;
	w = 35;
	h = 150 - pad*2;
	doc.text('TOTAL Heures / Jour',x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	y = yi+70;
	x = xi-70;
	w = 200;
	h = 20;
	doc.fontSize(11);
	doc.text('AFFAIRE',x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	x = x + w+62-3*pad;
	w = 35;
	h = 20;
	doc.fontSize(6);
	for (i = 1; i < 6 ; i++) {
		k = i.toString();
		aff = 'aff' + k;
		affaire = "result[0]." + aff;
		doc.text(eval(affaire) ,x,y+pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
		x = x + w;
		}
		
		x= xi-70;
		y = y + h+2*pad;
		w = 35;
		h = 100-pad;
		doc.text('JOUR',x,y+h/2-pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
	
	
	x= x + w;
	w= 30;
	doc.text('Date',x,y+h/2-pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
	x= x + w;
	h = 10;
	w = 100+pad;
	x= x + w;
	doc.rotate(270,{origin :[x,y+w]}).text('PDEP',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('GDEP',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('PARIS',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('ETRANGER',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('P.PDEP',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('P.GDEP',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('P.D.P.',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	doc.rotate(-270,{origin :[x,y+w]});
	x= x-w+h+pad*2;
	w = 35+pad;
	h = 100 - pad;
	doc.text('KMS',x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
	x= x + w+14;
	h = 10;
	w = 100+pad;
	x= x + w;
	doc.rotate(270,{origin :[x,y+w]});
	doc.text('Nuit',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('Week-end',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();y = y + h+pad*2;
	doc.text('Jour férié',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	h = 13.5;
	for (i = 1 ; i < 6; i++) {
	doc.text('H/J Travail',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	doc.text('H/J Voyage',x,y+pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	y = y + h+pad*2;
	}
		
	doc.rotate(-270,{origin :[x,y+w]});
	
		y = y + 100+pad;
		w = 35;
		h = 20;
		doc.font(__dirname + fontPath + "arial.ttf").fontSize(6);
		
		//####################           variables pour calcul des totaux       ####################
		
var frenchDays = ["","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
var thta = [0,0,0,0,0,0];
var thva = [0,0,0,0,0,0];
var ta = [0,0,0,0,0,0];
var tcd = 0;
var tfe = 0;
var trtt = 0;
var tjis = 0;
var tcp = 0;
var tma = 0;
var tsem = 0;
		
		//####################           variables pour calcul des totaux       ####################
		
		for (k = 1; k < 8 ; k++) {
			x= xi-371;
			w = 35;
	doc.text(frenchDays[k],x,y+h/2-pad,{width : w,height : h,align : "center"});
	doc.rect(x,y,w,h+pad*2).stroke();
	
		x = x + w;
		w = 30;
		dat = 'dat' + k;
		theDate = "result[0]." + dat;
		doc.text(shortDate(eval(theDate)) ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
		
		x = x + w;
		w = 14;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'pdep' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}
	
		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'gdep' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'paris' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}
		
		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'etranger' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'ppdep' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'pgdep' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'pdp' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		w = 37;
		mydata = 'kms' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		
		x = x + w;
		w = 14;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'nrdp' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'astnuit' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'astwe' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'astfe' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
		}
		var thtj = 0;
		var thvj = 0;
		
for (i = 1; i < 6 ; i++) {
	
		x = x + w;
		w = 17.5;
		mydata = 'ht' + i + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		thtj = parseFloat(thtj) + parseFloat(thedata);
		thta[i] = parseFloat(thta[i]) + parseFloat(thedata);
		tsem = parseFloat(tsem) + parseFloat(thedata);
		x = x + w;
		mydata = 'hv' + i + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		thvj = parseFloat(thvj) + parseFloat(thedata);
		thva[i] = parseFloat(thva[i]) + parseFloat(thedata);
		ta[i] = parseFloat(thta[i]) + parseFloat(thva[i]);
		tsem = tsem = parseFloat(tsem) + parseFloat(thedata);
}

		
		x = x + w;
		w = 14;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'cd' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
			tcd++;
		}

		x = x + w;
		doc.rect(x,y,w,h+pad*2).stroke();
		mydata = 'ferie' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata ==1) {
			doc.moveTo(x,y).lineTo(x+w,y+h+pad*2).moveTo(x,y+h+pad*2).lineTo(x+w,y).stroke();
			tfe++;
		}
		
		x = x + w;
		mydata = 'rtt' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		trtt = parseFloat(trtt) + parseFloat(thedata);
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		
		x = x + w;
		mydata = 'jis' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		tjis = parseFloat(tjis) + parseFloat(thedata);
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		
		x = x + w;
		mydata = 'cp' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		tcp = parseFloat(tcp) + parseFloat(thedata);
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		
		x = x + w;
		mydata = 'ma' + k;
		thedata = "result[0]." + mydata;
		thedata = eval(thedata);
		if (thedata > 0) {
		doc.text(thedata ,x,y+h/2-pad,{width : w,height : h,align : "center"});
		tma = parseFloat(tma) + parseFloat(thedata);
		}
		doc.rect(x,y,w,h+pad*2).stroke();
		
		
		x = x + w;
		w = 35;
		tj = parseFloat(thtj) + parseFloat(thvj);
		if (tj > 0) {
		doc.text( tj.toFixed(2),x,y+h/2-pad,{width : w,height : h,align : "center"});
		}
		doc.rect(x,y,w,h+pad*2).stroke();
				
	y = y + h + pad*2;
		}
		doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(6);
		x = xi - 371;
		xrect = x;
		yrect = y;
		w = 163;
		doc.text( 'TOTAL',x+pad,y+h/2-pad,{width : w,height : h,align : "left"});
		y = y + h + pad*2;
		doc.text( 'TOTAL GENERAL',x+pad,y+h/2-pad,{width : w,height : h,align : "left"});;
		doc.rect(xrect,yrect,w,2*h + pad*4).stroke();
		
		x = x + w + 93;
		xt = x;
		for (i = 1; i < 6 ; i++) {
			w = 17.5;
			doc.text(thta[i].toFixed(2),x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x+ w;
		doc.text(thva[i].toFixed(2),x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		}
		w = 14;
		doc.text(tcd,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		doc.text(tfe,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		doc.text(trtt,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		doc.text(tjis,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		doc.text(tcp,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		x = x + w;
		doc.text(tma,x,yrect+h/2-pad,{width : w,height : h,align : "center"});;
		doc.rect(x,yrect,w,h+pad*2).stroke();
		
		x = x + w;
		w = 35;
		
		doc.text( tsem.toFixed(2),x,yrect+h/2-pad,{width : w,height : h,align : "center"});
		doc.rect(x,yrect,w,h+pad*2).stroke();
		
		// y = y + pad*2;
		x = xt;
	for (i = 1; i < 6 ; i++) {
		doc.text( ta[i].toFixed(2),x,y+h/2-pad,{width : w,height : h,align : "center"});
		doc.rect(x,y,w,h+pad*2).stroke();
		x = x + w;
	}
		
y = y + h;
x = xi - 371;
w = 550;		
		doc.text( 'PDEP - Petit déplacement France',x+pad,y+h/2-pad,{width : w,height : h,align : "left"});
		y = y + h;
		doc.text( 'PGEP - Grand déplacement',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h/2;
		doc.text( 'PARIS (75 - 77 - -78 - 91 - 92 - 93 - 94 - 95)',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h/2;
		doc.text( 'P.PDEP - Prime Petit déplacement France (exclus fonction intervention)',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h/2;
		doc.text( 'P.GDEP - Prime Grand déplacement (exclus fonction intervention)',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h/2;
		doc.text( 'P.D.P. - Prime Départ Précipité < 24 heures (exclus fonction intervention)',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h/2;
		doc.text( 'Prime de non respect du délai de prévenance : (exclus fonction intervention)',x+pad,y,{width : w,height : h,align : "left"});
				y = y + h/2;
		hrect = y - yrect;
		doc.rect(x,yrect,w,hrect).stroke();		

		
y = y + h/2;
x = xi - 371;
xi = x;
w = 100;
		doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(8);
	doc.text( 'Note de frais (à joindre) :',x+pad,y,{width : w,height : h,align : "left"});
		y = y + h;	
	doc.text( 'Observations :',x+pad,y,{width : w,height : h,align : "left"});
	x = x + w;
	doc.font(__dirname + fontPath + "arial.ttf").fontSize(8);
		doc.text(result[0].comments ,x,y,{width : 450,height : h*4,align : "justify"});
		y = doc.y;
		y = y + h;
		x = xi;
		doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(8);
	doc.text( 'Signature du salarié :',x+pad,y,{width : w,height : h,align : "left"});
	x = x + w;
	doc.font(__dirname + fontPath + "arial.ttf").fontSize(8);
		doc.text(getName(result[0].phcName) ,x,y,{width : w,height : h,align : "left"});
		
		x = x + w*2;
		doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(8);
	doc.text( 'Chef de service :',x,y,{width : w,height : h,align : "left"});
	x = x + w;
	doc.font(__dirname + fontPath + "arial.ttf").fontSize(8);
		doc.text(getName(result[0].vcsName) ,x,y,{width : w,height : h,align : "left"});
		
x = xi;
w = 550;
y = 1170;
h = 10;
	doc.font(__dirname + fontPath + "arialbd.ttf").fontSize(8);
	doc.text( 'Ce document est à transmettre chaque fin de semaine à votre responsable de service pour validation et transmission au service RH.',x,y,{width : w,height : h,align : "center"});
	y = y + h;
	doc.font(__dirname + fontPath + "arial.ttf").fontSize(8);
		doc.text("Ces documents sont la propriété de Fives Machining, leur divulgation ne pourra s'effectuer sans notre accord écrit." ,x,y,{width : w,height : h,align : "center"});
		
		y = y + h;
		doc.text("E3-GRH-V1" ,x,y,{width : w,height : h,align : "left"});
		
		
    // stream le PDF dans la réponse
    doc.pipe(res);
    doc.end();
});
 });  
})

 
/*#######################################################################
###########    identification                  ##############################
#######################################################################*/

.post('/user/', urlencodedParser,function (req, res) {
	//####################################                Matricules chef de service       ############################################################
	manager_array = ["537","431","283","451","453","003","443"];
	chef_array = {"achats" : "537","avant-projets" : "431","bea - bee" : "283","bem" : "451","électrique" : "120","magasin" : "537","mise en route" : "430","montage" : "529","prémontage" : "184","production" : "453","projets" : "003","qse" : "003","sav" : "443"};
	
    if (req.body.userInput !== '' && req.body.passwordInput !== '') {
var logquery = connectphc.query('SELECT COUNT(mat) AS spyCount ,mat,LOWER(nom) AS minNom, LOWER(prenom) AS minPrenom, LOWER(service) AS serv FROM personnel WHERE login = "' + req.body.userInput + '" AND mdp = "' + req.body.passwordInput + '" ',
function(err,rows,fields) {
	
if (rows[0].spyCount > 0) {
	prenom  = rows[0].minPrenom;
	nom = rows[0].minNom;
	if (manager_array.indexOf(rows[0].mat) !== -1) {chefMat = '003';} else {chefMat = chef_array[rows[0].serv] ;}
	cookieVal = rows[0].mat + '-' + nom + ' ' + prenom + '-' + chefMat;
	
	cookies = new Cookies(req,res);
	  cookies.set('infobuCookie', cookieVal, { httpOnly: false});
	
	res.redirect(req.body.hiddenurl); 
}
else
{
res.render('LogError.ejs',{thisurl: req.body.hiddenurl,mycookie : undefined});
} 	
    });
 
  }
else
{
res.render('emptyLogError.ejs',{thisurl: req.body.hiddenurl,mycookie : undefined});
} 	
})

/*#######################################################################
###########    Changement d'identifiants        ##############################
#######################################################################*/

.post('/changelog/', urlencodedParser,function (req, res) {
	
    if (req.body.newuserInput !== '' && req.body.newpasswordInput !== '') {
		 cookies = new Cookies(req,res);
  infobuCookie = cookies.get( "infobuCookie" );
  
  if (typeof(infobuCookie) !== 'undefined') {
cookieMat = infobuCookie.substring(0,infobuCookie.indexOf("-",0));
  
var changelogquery = connectphc.query('UPDATE personnel SET  login = "' + req.body.newuserInput + '" , mdp = "' + req.body.newpasswordInput + '" WHERE mat = "' + cookieMat + '" ');
	}
  res.redirect(req.body.hiddenurl); 
  }
else
{
res.render('emptyLogError.ejs');
} 

})

/*#######################################################################
###########    Fermer la session        ##############################
#######################################################################*/

.get('/clearSession/', function (req, res) {

		cookies = new Cookies(req,res);
		cookies.set('infobuCookie',null);
res.redirect('/pointage/'); 

});
