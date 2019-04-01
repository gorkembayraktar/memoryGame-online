const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

app.set('view engine','ejs');

const socketIO = require('socket.io');

const server = app.listen(PORT,()=> console.log(PORT+" portu aktif"));

const io = socketIO(server);
const path = require('path');

const ejs = require('ejs');


app.use('/public',express.static(__dirname + '/public'))

const imgUrls = require('./gameCreate');

var users = {};
var name = "";
var roomid = "";

var cards ={};




var games = [
    {
        gameId : "SYSTEMTEST1",
        gameCreate : Date.now(),
        start:false,
        usersCount:0,
        roomExplain:"Sistem tarafından otomatik oluşturulan bir oda!",
        roomName:"System",
        theme:"THE FLASH"
    },{
        gameId : "SYSTEMTEST2",
        gameCreate : Date.now(),
        start:false,
        usersCount:0,
        roomExplain:"Sistem tarafından otomatik oluşturulan bir oda!",
        roomName:"System",
        theme:"THE FLASH"
    },{
        gameId : "SYSTEMTEST3",
        gameCreate : Date.now(),
        start:false,
        usersCount:0,
        roomExplain:"Sistem tarafından otomatik oluşturulan bir oda!",
        roomName:"System",
        theme:"THE FLASH"
    }
];



app.get('/',(req,res)=>{
    res.render('index',gamesState());
})
app.get('/:roomid',(req,res)=>{
   
    roomid = req.params.roomid;
    if(hasGames(roomid)){

        gamesUsersCount(roomid,true);
        
        let count = (games.find(game => game.gameId == roomid)).usersCount;
         if(count == 2){
            gamesActive(roomid);
         }
         if(count > 2){
               // res.json({error:"limit",message:"oda maximumu kullanıcı sayısına ulaştı"});
            res.redirect('/');
         }else{
            res.sendFile(path.join(__dirname,"/anasayfa.html"));
         }

       
     
    }else
        res.redirect('/');
        // res.render('index',{error :{type:"nogame",message:"Böyle bir oda açılmamış"}});
    
  
})

function hasGames(gameid){
    return games.some(i => i.gameId == gameid);
}

function randomAccess(len){
    var data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
    var text ="";
    for(let i = 0; i<len;i++){
        text+= data[~~(Math.random() * data.length)];
    }
    return text;
    
}

io.sockets.on("connection", function(socket){
 
   //console.log("Aktif OYUNLAR",games);
   //console.log(`Bağlanan id : ${socket.id} , room : ${roomid}`);
   
   

   socket.on("nName", function(name){

        users[socket.id] = {
            roomid : name.roomid,
            name : name.name
        };

        socket.emit('node my',{id:socket.id,room:name.roomid});

        socket.join(users[socket.id].roomid);

        
        socket.broadcast.in(users[socket.id].roomid)
        .emit("node new user", users[socket.id]);
    
   
    });

    socket.on('node ng rename',(json)=>{
        
         if(users[socket.id] && cards[users[socket.id].roomid] && cards[users[socket.id].roomid].isContinue){
             
             for(var i= 0 ; i < cards[users[socket.id].roomid].users.length;i++ ){
                 if(cards[users[socket.id].roomid].users[i].id == json.id){
                    cards[users[socket.id].roomid].users[i].name = json.name;
                    break;
                 }
             }
             io.sockets.in(users[socket.id].roomid).emit('node ng rename',json);  
         }else{
             console.log('rename çalışmadı!');
         }

       

    })

    //socket.server.engine.clientsCount -> client count
    
    socket.on('node new message',function(data){
         io.sockets.in(users[socket.id].roomid).emit('node news', {user:users[socket.id],id:socket.id,message:data});
         
    });

    // oyun oluşturulur ve kullanıclar cliente taşınır.
    socket.on('node new game',function(data){

        // :/
        io.sockets.in(users[socket.id].roomid).emit('node ng', data);
   
    });
    socket.on('node ng started',function(data){

        if(cards[users[socket.id].roomid]){
            cards[users[socket.id].roomid].users.push(
                {
                    name:users[socket.id].name,
                    scor:0,
                    req:0,
                    id:socket.id,
                    create:Date.now()
                }
            )
        }else{
           cards[users[socket.id].roomid] = {
               users:[
                   {
                        name:users[socket.id].name,
                        scor:0,
                        req:0,
                        id:socket.id,
                        create:Date.now()
                    }
                ],
                
               order:~~(Math.random() * 2),
               card:shuffle(imgUrls).concat(shuffle(imgUrls)),
               opens:[],
               target:1,
               TIMER : {
                    interval : null,
                    sec : 10,
                    max : 10
               },
               isContinue:true
               
           }
           

        }
        
        var _card = cards[users[socket.id].roomid];
        if(_card.users.length == 2){
        
                io.sockets.in(users[socket.id].roomid).emit('node ng on',{ active: _card.users[_card.order], users:_card.users });
           
        }
          

    });
   
   function orderChange(){
       if(users[socket.id] && users[socket.id].roomid){
                if( cards[users[socket.id].roomid].order == 1){
                    cards[users[socket.id].roomid].order = 0;
                }else{
                    cards[users[socket.id].roomid].order = 1;
                } // tersinin tersini alamadım :/
        }
   } 
   
   socket.on('node ng card',(data)=>{
       // sira değişirken tek açık kartları kapaması gerek
        var sonuc = false;
        var card = cards[users[socket.id].roomid];
        if(card){
          
            sonuc = card && socket.id == card.users[card.order].id && card.isContinue; // is
            
            if(sonuc){

                io.sockets.in(users[socket.id].roomid)
                .emit('node ng card', 
                {error:false,cardId:data,card : card["card"][(data * 1)-1] } );


                cards[users[socket.id].roomid].users[card.order].req  = cards[users[socket.id].roomid].users[card.order].req  + 1;
                cards[users[socket.id].roomid].opens.push({
                    img:card["card"][data - 1].img,
                    id:data
                
                });
                if(cards[users[socket.id].roomid].users[card.order].req == 2){
                    
                    setTimeout(function(){

                        var opens =cards[users[socket.id].roomid].opens;

                        if(opens[opens.length-1].img == opens[opens.length-2].img){
                            
                            cards[users[socket.id].roomid].users[cards[users[socket.id].roomid].order].scor =  cards[users[socket.id].roomid].users[cards[users[socket.id].roomid].order].scor + 1;
                            
                            io.sockets.in(users[socket.id].roomid)
                            .emit('node ng cardsonuc',{state:true,won : cards[users[socket.id].roomid].users[cards[users[socket.id].roomid].order]});

                            if(cards[users[socket.id].roomid].users[cards[users[socket.id].roomid].order].scor == cards[users[socket.id].roomid].target){
                                if(users[socket.id] && users[socket.id].roomid){
                                    cards[users[socket.id].roomid].isContinue = false;
                                    io.sockets.in(users[socket.id].roomid)
                                    .emit('node ng cardwon',{data : cards[users[socket.id].roomid].users[cards[users[socket.id].roomid].order] });
                                }
                            }
                            cards[users[socket.id].roomid].opens = [];

                        }else{
                        
                            setTimeout(function(){
                                    io.sockets.in(users[socket.id].roomid)
                                    .emit('node ng cardsonuc',{state:false,ids:[opens[opens.length-1].id,opens[opens.length-2].id]});
                                    
                                    if(cards[users[socket.id].roomid].TIMER.interval){
                                        clearInterval(cards[users[socket.id].roomid].TIMER.interval);
                                        cards[users[socket.id].roomid].TIMER.sec = cards[users[socket.id].roomid].TIMER.max;
                                    }

                                    cards[users[socket.id].roomid].TIMER.interval = setInterval(function(){

                                        if( users[socket.id] && !cards[users[socket.id].roomid].isContinue){
                                            clearInterval(cards[users[socket.id].roomid].TIMER.interval);
                                        }
                                    
                                        if(users[socket.id] && users[socket.id].roomid){
                                            io.sockets.in(users[socket.id].roomid)
                                            .emit('node ng timer',cards[users[socket.id].roomid].TIMER.sec);
                                        
                                            cards[users[socket.id].roomid].TIMER.sec  = cards[users[socket.id].roomid].TIMER.sec - 1;
                                            
                                            if(cards[users[socket.id].roomid].TIMER.sec == 0){

                                               
                                                orderChange();
                                                cards[users[socket.id].roomid].TIMER.sec = cards[users[socket.id].roomid].TIMER.max;
                                                io.sockets.in(users[socket.id].roomid).emit('node ng siradegis',card.users[card.order].id);

                                             /*   io.sockets.in(users[socket.id].roomid).emit('node ng cardsonuc',
                                                    {state:false,ids:(cards[users[socket.id].roomid].opens.length == 2) ?
                                                    [cards[users[socket.id].roomid].opens[0].id,cards[users[socket.id].roomid].opens[1]]:
                                                    cards[users[socket.id].roomid].opens[0]});
                                                
*/
                                               
                                                
                                            }
                                           
                                    
                                     } // socket id kontrou yapılmaı#

                                        
                                    },1000);

                                },700);
                        }
                        
                        cards[users[socket.id].roomid].users[card.order].req = 0;
                        
                            
                                orderChange(); // order dğeiştir
                                io.sockets.in(users[socket.id].roomid).emit('node ng siradegis',card.users[card.order].id);

                    });
                    
                }
            
            }else{
                io.sockets.in(users[socket.id].roomid)
                .emit('node ng card',
                {error:true});
            }
            
        }
       


    });
    
    socket.on('node ng rovans',(req)=>{
        io.sockets.in(users[socket.id].roomid).emit('node ng rovans',req);
    })

    socket.on('node ng rovans ok',(req)=>{
        io.sockets.in(users[socket.id].roomid).emit('node ng rovans ok',req);
    })


   socket.join("ANASAYFA"); // TÜM ODALAR GÜNCELLENMELİ
   socket.on('create Server', (data) => {
        var rand = randomAccess(6);
        games.push({
            gameId : rand,
            gameCreate : Date.now(),
            start:false,
            usersCount:0,
            roomExplain:data.explain,
            roomName:data.name,
            theme:"THE FLASH"
        });

        io.sockets.in(users[socket.id].roomid).emit('node ng redirect',rand);

        io.sockets.in("ANASAYFA").emit('game append',games[games.length-1]);

        socket.emit('create get',rand);
      
   });
   
   socket.on('disconnect',()=>{
   
        if(users[socket.id]){
            io.sockets.in(users[socket.id].roomid)
            .emit('node disconnect', {name:users[socket.id].name});
            gamesController(users[socket.id]);
            gamesUsersCount(users[socket.id].roomid,false);
        }
            
        delete users[socket.id];

       
   });
});


function gamesController(ROOM){
    //console.log("KONTROL EDİLİYOR..")

    if(ROOM){
        let countGroup = {};
        let jn = Object.values(users);
        
        for(let i = 0; i < jn.length;i++){
            if(jn[i].roomid == ROOM.roomid){
                if(countGroup[ROOM.roomid]){
                    countGroup[ROOM.roomid] = countGroup[ROOM.roomid] + 1;   
                }else{
                    countGroup[ROOM.roomid] = 1;
                }
            }
        }
       // console.log("GRUPLANDIRILDI !!");
        // users silinmeden geldiği için +1 fazla kayıt gösteriyor#
        if(countGroup[ROOM.roomid] <= 1){
            games = games.filter(game => game.gameId  != ROOM.roomid );
        }

        
    }

    /*if(games.length > 0)
         games= games.filter(i=> userHave(i).roomid != i.gameId);*/

      
}

function userHave(gameid){
    console.log("Game id : ",gameid);
    var keyval = Object.entries(users);
    var result = {};
    for(var i = 0 ; i < keyval.length;i++){
        if(keyval[i][1].roomid == gameid){
            result = keyval[i][1];
            break;
        } 
    }
    return result;
}

function gamesUsersCount(roomid,isIncrement){
    for(let i = 0 ; i < games.length;i++){
        if(games[i].gameId == roomid){
            if(isIncrement)
                games[i].usersCount = games[i].usersCount + 1;
            else
                games[i].usersCount = games[i].usersCount - 1;    
            break;
        } 
    }    
}

function gamesActive(gameid){
    for(let i = 0 ; i < games.length;i++){
        if(games[i].gameId == gameid){
            games[i].start = true;
            break;
        }
    }
}

function isGameStarted(gameid){
    
    if(hasGames(gameid)){
        return (games.find(game => game.gameId == gameid)).start;
    }
    return false;
    
}

var each = (obje,callback) => {

}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  var gamesState = () => Object.assign({},games,{
      aktifler:games.filter(game => game.usersCount >= 2),
      pasifler:games.filter(game=> game.usersCount < 2),
  })