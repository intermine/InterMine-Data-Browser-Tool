//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();

chai.use(chaiHttp);

describe('Statistics', () => {
  describe('/GET count of HumanMine primary classes', () => {
      it('it should GET the count of HumanMine primary classes', (done) => {
        chai.request(server)
            .get('/statistics/count/primary/humanmine')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
				res.body.length.should.equal(2);
				res.body[0]["name"].should.equal("Gene")
                res.body[0]["count"].should.be.at.least(0);
				res.body[1]["name"].should.equal("Protein")
				res.body[1]["count"].should.be.at.least(0);
              done();
            });
      });
	  
	  it('it should GET the count of items inside class Protein in HumanMine', (done) => {
        chai.request(server)
            .get('/statistics/count/items/humanmine/Protein')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
				res.body.length.should.equal(1);
				res.body[0]["itemName"].should.equal("Organism short name")
                should.exist(res.body[0]["response"]);
              done();
            });
      });
	  
	  it('it should GET the count of items inside class Gene in HumanMine', (done) => {
        chai.request(server)
            .get('/statistics/count/items/humanmine/Gene')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
				res.body.length.should.equal(1);
				res.body[0]["itemName"].should.equal("Organism short name")
                should.exist(res.body[0]["response"]);
              done();
            });
      });
  });

});