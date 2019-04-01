var images = [
    {"img":"public/img/img1.jpg","open" : false},
    {"img":"public/img/img2.jpg","open" : false},
    {"img":"public/img/img3.jpg","open" : false},
    {"img":"public/img/img4.jpg","open" : false},
    {"img":"public/img/img5.jpg","open" : false},
    {"img":"public/img/img6.jpg","open" : false},
    
    {"img":"public/img/img7.jpg","open" : false},
    {"img":"public/img/img8.jpg","open" :false},
    
    {"img":"public/img/img9.jpg","open" :false},
    {"img":"public/img/img10.jpg","open" :false},
];



var cardCreate = (roomid,user,socketid) =>{
    let games = {};
    
    games[roomid] = {
        users:[
            {
                name:user.name,
                id:socketid,
                create:Date.now(),
                scor : 0,
                req : 0
            }
        ],
        order:[this.users.length],
        card:[
            {"card1" : igames.card1},
            {"card2" : igames.card1},
        ]
    }


} 



module.exports = images;