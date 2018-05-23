var express = require('express');
var imjs = require('imjs');
var request = require('request');
var router = express.Router();

/* GET count of items per class in a certain mine. */
router.get('/count/primary/humanmine', function(req, res, next) {
    var result = []

    var service = new imjs.Service({
        root: 'http://www.humanmine.org/humanmine/service'
    });

    var query = {
        "from": 'Gene',
        "select": ['primaryIdentifier']
    };

    service.count(query).then(function(response) {
        result.push({
            "name": "Gene",
            "count": response
        });
        var query = {
            "from": 'Protein',
            "select": ['primaryIdentifier']
        };
        service.count(query).then(function(response) {
            result.push({
                "name": "Protein",
                "count": response
            });
            res.json(result);
        })

    })
});

/* GET count of items inside a class in HumanMine. */
router.get('/count/items/humanmine/:classname', function(req, res, next) {

    var className = req.params.classname;

    if (className != "Protein" && className != "Gene") {
        res.status(500).send('You need to specify a valid class: Protein, Gene');
    }

    var result = []

    var service = new imjs.Service({
        root: "http://www.humanmine.org/humanmine/service"
    });

    if (className == "Gene") {
        var query = {
            "from": 'Gene',
            "select": ['primaryIdentifier'],
            "model": {
                'name': 'genomic'
            }
        };

        var q = new imjs.Query(query, service);

        q.summarize("Gene.organism.shortName", 10)
            .then(function(response) {
                result.push({
                    "itemName": "Organism short name",
                    "response": response
                });
				res.json(result);
            }).catch(function(error) {
                console.log('error');
                console.log(error.message);
            });

    }

    if (className == "Protein") {
        var query = {
            "from": 'Protein',
            "select": ['primaryIdentifier'],
            "model": {
                'name': 'genomic'
            }
        };

        var q = new imjs.Query(query, service);

        q.summarize("Protein.organism.shortName", 10)
            .then(function(response) {
                result.push({
                    "itemName": "Organism short name",
                    "response": response
                });
                res.json(result);
            }).catch(function(error) {
                console.log('error');
                console.log(error.message);
            });
    }

});

module.exports = router;