const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
const fs = require('fs'); // import in the file system
const mysql = require('mysql2/promise');

let app = express();
// set which view engine to use
app.set('view engine', 'hbs');

// set where to find the static files
app.use(express.static('public'))

// setup wax on for template inhteritance
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// setup forms
app.use(express.urlencoded({
    extended:false
}))

// import handlebars-helpers
const helpers = require('handlebars-helpers')({
  handlebars: hbs.handlebars
});

async function main(){
    // creating conection is async hence need await, else will have bug
    const connection = await mysql.createConnection ({
        'host':'localhost',
        'user':'root',
        'database':'sakila'
    })

    app.get('/', async (req,res)=>{
        // connection.execute is async
        // [] is syntax required
        let [actors] = await connection.execute('select * from actor');
        res.render('actors.hbs', {
            'actors':actors,
        })
    })

    app.get('/country', async (req,res)=>{
        let [country] = await connection.execute('select * from country');
        res.render('country.hbs', {
            'country':country,
        })
    })
    // create country url, here not async yet
    app.get('/country/create', (req,res)=>{
        res.render('create_country.hbs');
    })
    // here its async cause of .execution requirements
    app.post('/country/create', async (req,res)=>{
        // sub into key to make it easier to code, need req.body for user input to be registered
        let country = req.body.country;
        // test the `code` in mysql first before inputing to make sure it works, replacing value with '(?)'
        let query = 'insert into country(country) values (?)';
        // since its async, need await else will get undefined error
        await connection.execute(query,[country]);
            // redirect back to org url to view addition
            res.redirect('/country');
        })

    // edit country
    app.get('/country/:country_id/edit', async (req,res)=> {
        let [countries] = await connection.execute(`select * from country where country_id=?`,
        [req.params.country_id]);

        let theCountry = countries[0];
        res.render('edit_country.hbs', {
            'country': theCountry
        });
    })
     app.post('/country/:country_id/edit', async (req,res)=> {
         // use body cause you are taking from edit_country.hbs body portion
        let country = req.body.country;
        // use params cause you are accessing the parameter (params)
        let country_id = req.params.country_id;

    await connection.execute(`update country set country=? where country_id=?`,
                            [country,country_id])
    res.redirect('/country');
    })

    // delete
    app.get('/country/:country_id/delete', async(req,res)=>{
        // same as get_id for create, just eith extra key to make code neater
        let delCountry = req.params.country_id;
        let [countrys] = await connection.execute(`select * from country where country_id=?`,
        [delCountry]);

        let theCountry = countrys[0];
        // res.send('working'); 
        res.render('delete_country.hbs', {
            'country' : theCountry
        })
    app.post('/country/:country_id/delete', async(req,res)=>{
        let country_id = req.params.country_id;
        await connection.execute(`delete from country where country_id = ?`, [country_id]);
        res.redirect('/country')
    })  

    })
}
main();

app.listen(3000, ()=>{
 console.log("Server started");
});