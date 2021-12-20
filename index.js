const mysql = require('mysql');
const Firebird = require('node-firebird');

const cliente    = 'JAGUARIUNA';
const codcliente = 3024;


////////////////////////////////FIREBIRD////////////////////////////////////
const bancofirebird = '/opt/firebird/BASE_JAGUARIUNA.FDB'


var options = {};

options.host = '127.0.0.1';
options.port = 3050;
options.database = bancofirebird;
options.user = 'SYSDBA';
options.password = 'masterkey';
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null;            // default
options.pageSize = 4096;        // default when creating database
//////////////////////////////////////////////////////////////////////////

var con = mysql.createConnection({
  host     : '144.217.100.77',
  user     : 'mga',
  password : 'mg@2017',
  database : 'whats'
});


try{
con.connect(function(err) {
  if (err) throw err;

  function intervalFunc() {
  con.query(`SELECT idmensagem,resposta,'WHATSAPP' as usuario, DATE_FORMAT(data, '%d.%m.%Y 00:00') as data1, DATE_FORMAT(data, '%H%i') as hora,inserido FROM whats.retorno WHERE empresa =${codcliente} and resposta !='' and inserido = 0`, function (err, result, fields) {
    if (err) enviaWhats(whatsapp,`${cliente}: ERRO AO BUSCAR NO MYSQL ${err}`);  
    if(result.length ==0 ) console.log("zzz...");
    if(result.length >0) console.log(`Encontrado ${result.length} registros`);


    //OBTEM OS ITENS DA PESQUISA E INSERE NO FIREBIRD
    Object.keys(result).forEach(function(key) {
        var row = result[key];
                /*------------------------------------INSERE NO FIREBIRD-------------------------------------*/
                Firebird.attach(options, function (err, db) {

                  if (err)
                    throw err;               
                   
                  if(row.resposta == 'NAO'){
                    var update = `UPDATE amb_aged SET SMS_RETORNO ='${row.resposta}', USR_CONFIRMA='${row.usuario}',DAT_CONFIRMA='${row.data1}',HOR_CONFIRMA='${row.hora}',SITUACAO = 'I' WHERE ID = ${row.idmensagem}`;
                  }else{
                    var update = `UPDATE amb_aged SET SMS_RETORNO ='${row.resposta}', USR_CONFIRMA='${row.usuario}',DAT_CONFIRMA='${row.data1}',HOR_CONFIRMA='${row.hora}' WHERE ID = ${row.idmensagem}`;
                  }
    
                  db.execute( update, function (err, result) {
    
                    if (typeof err !== 'undefined') {
                      console.log(`*************************${err}*******************************`)               
                               
                    }else{
                      console.log(`Alterado o item ${row.idmensagem}`)
                    }

    
                    con.query(`UPDATE whats.retorno SET inserido = 1 WHERE empresa = ${codcliente} and idmensagem = ${row.idmensagem}`, function (err, result) {
                      if (err)  enviaWhats(whatsapp,`${cliente}: ERRO AO ATUALIZAR O MYSQL ${err}`);    
                      console.log(`Foi atulizado inserido do id ${row.idmensagem}`);    
                    });
    
       
                      db.detach();
                
                  });
    
    
    
                });      
    });
  });
}setInterval(intervalFunc, 10000);
});
}
catch(e){
  console.log(e);
}



